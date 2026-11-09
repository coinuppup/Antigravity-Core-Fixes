import os, sys, json, struct, copy, hashlib

def digest(data):
    return hashlib.sha256(data).hexdigest()

def walk_asar(entry, prefix=''):
    for key, value in entry.get('files', {}).items():
        path = f'{prefix}/{key}' if prefix else key
        if 'files' in value:
            yield from walk_asar(value, path)
        elif 'offset' in value and not value.get('unpacked'):
            yield path, value

def read_asar(data):
    sizes = struct.unpack('<4I', data[:16])
    header_len = sizes[3]
    header = json.loads(data[16:16 + header_len].decode('utf-8'))
    base_offset = 8 + sizes[1]
    
    file_map = {}
    for name, entry in walk_asar(header):
        offset = base_offset + int(entry['offset'])
        size = int(entry['size'])
        file_map[name] = data[offset:offset + size]
    return header, file_map

def pack_asar(files_dict):
    header = {"files": {}}
    current_offset = 0
    bodies = []
    
    sorted_paths = sorted(files_dict.keys())
    for path in sorted_paths:
        content = files_dict[path]
        size = len(content)
        parts = path.split('/')
        curr = header["files"]
        for p in parts[:-1]:
            if p not in curr:
                curr[p] = {"files": {}}
            curr = curr[p]["files"]
        curr[parts[-1]] = {
            "size": size,
            "offset": str(current_offset)
        }
        current_offset += size
        bodies.append(content)
        
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    header_len = len(header_json)
    pad_len = (4 - (header_len % 4)) % 4
    header_padded = header_json + b'\x00' * pad_len
    
    payload_size = len(header_padded) + 8
    pickle_hdr = struct.pack('<4I', 4, payload_size, payload_size - 4, header_len)
    
    return pickle_hdr + header_padded + b''.join(bodies)

def repack(header, files):
    """Keep original ASAR links, unpacked entries and metadata, recalculate offsets/integrity."""
    header = copy.deepcopy(header)
    bodies = []
    offset = 0
    def visit(entry, prefix=''):
        nonlocal offset
        for name, child in entry.get('files', {}).items():
            key = f'{prefix}/{name}' if prefix else name
            if 'files' in child:
                visit(child, key)
            elif 'offset' in child and not child.get('unpacked'):
                data = files[key]
                child['offset'] = str(offset)
                child['size'] = len(data)
                offset += len(data)
                bodies.append(data)
                if 'integrity' in child:
                    integrity = child['integrity']
                    size = integrity.get('blockSize', 4 * 1024 * 1024)
                    if integrity.get('algorithm') != 'SHA256':
                        raise ValueError('Unsupported ASAR integrity algorithm')
                    integrity['hash'] = digest(data)
                    integrity['blocks'] = [digest(data[i:i + size]) for i in range(0, len(data), size)]
    visit(header)
    encoded = json.dumps(header, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    padded = encoded + b'\0' * ((-len(encoded)) % 4)
    payload = len(padded) + 8
    return struct.pack('<4I', 4, payload, payload - 4, len(encoded)) + padded + b''.join(bodies)
