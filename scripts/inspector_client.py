"""Small dependency-free Node Inspector client used by the macOS launcher."""
import base64
import hashlib
import json
import os
import socket
import struct
from urllib.parse import urlparse


class InspectorError(RuntimeError):
    pass


class InspectorClient:
    def __init__(self, websocket_url, timeout=10):
        parsed = urlparse(websocket_url)
        if parsed.scheme != 'ws' or parsed.hostname not in ('127.0.0.1', 'localhost'):
            raise InspectorError('Inspector must be a loopback WebSocket')
        self.sock = socket.create_connection((parsed.hostname, parsed.port), timeout=timeout)
        self.sock.settimeout(timeout)
        key = base64.b64encode(os.urandom(16)).decode('ascii')
        request = (
            f'GET {parsed.path} HTTP/1.1\r\nHost: {parsed.hostname}:{parsed.port}\r\n'
            f'Upgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n'
            'Sec-WebSocket-Version: 13\r\n\r\n'
        )
        self.sock.sendall(request.encode('ascii'))
        response = self._read_http_headers()
        expected = base64.b64encode(hashlib.sha1((key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()).digest()).decode()
        if not response.startswith('HTTP/1.1 101') or expected.lower() not in response.lower():
            raise InspectorError(f'Inspector WebSocket upgrade failed: {response.splitlines()[0]}')
        self.next_id = 1

    def _read_http_headers(self):
        data = bytearray()
        while b'\r\n\r\n' not in data:
            chunk = self.sock.recv(4096)
            if not chunk: raise InspectorError('Inspector closed during WebSocket upgrade')
            data.extend(chunk)
        return data.decode('latin1')

    def _recv_exact(self, count):
        data = bytearray()
        while len(data) < count:
            chunk = self.sock.recv(count - len(data))
            if not chunk: raise InspectorError('Inspector WebSocket closed')
            data.extend(chunk)
        return bytes(data)

    def _send_frame(self, payload, opcode=1):
        payload = payload if isinstance(payload, bytes) else payload.encode('utf8')
        mask = os.urandom(4)
        head = bytearray([0x80 | opcode])
        if len(payload) < 126: head.append(0x80 | len(payload))
        elif len(payload) < 65536: head.extend([0x80 | 126]); head.extend(struct.pack('!H', len(payload)))
        else: head.extend([0x80 | 127]); head.extend(struct.pack('!Q', len(payload)))
        head.extend(mask)
        head.extend(byte ^ mask[index % 4] for index, byte in enumerate(payload))
        self.sock.sendall(head)

    def _recv_frame(self):
        first, second = self._recv_exact(2)
        opcode = first & 0x0F
        length = second & 0x7F
        if length == 126: length = struct.unpack('!H', self._recv_exact(2))[0]
        elif length == 127: length = struct.unpack('!Q', self._recv_exact(8))[0]
        mask = self._recv_exact(4) if second & 0x80 else None
        payload = self._recv_exact(length)
        if mask: payload = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
        if opcode == 9:
            self._send_frame(payload, opcode=10)
            return self._recv_frame()
        if opcode == 8: raise InspectorError('Inspector WebSocket closed')
        return payload.decode('utf8')

    def call(self, method, params=None):
        request_id = self.next_id; self.next_id += 1
        self._send_frame(json.dumps({'id': request_id, 'method': method, 'params': params or {}}, separators=(',', ':')))
        while True:
            message = json.loads(self._recv_frame())
            if message.get('id') != request_id: continue
            if 'error' in message: raise InspectorError(f'{method}: {message["error"]}')
            return message.get('result', {})

    def close(self):
        try: self._send_frame(b'', opcode=8)
        except Exception: pass
        self.sock.close()


def load_runtime(websocket_url, runtime_path):
    client = InspectorClient(websocket_url)
    try:
        # --inspect-brk initially waits before Node's own module machinery is
        # fully initialized. Let it advance to the first application line,
        # where it remains paused, before requiring the plugin.
        client.call('Runtime.enable')
        client.call('Debugger.enable')
        client.call('Runtime.runIfWaitingForDebugger')
        require_expression = ('process.getBuiltinModule("module").createRequire(process.cwd()+"/__agcf_loader__.cjs")(' + json.dumps(str(runtime_path)) + ')')
        # Electron's embedded Node initializes debuglog immediately after the
        # first-line break. Queue the require for the first event-loop turn;
        # the runtime prepends an app-ready listener, so its preload still
        # registers before the official window is created.
        expression = 'setImmediate(() => { try { ' + require_expression + ' } catch (error) { process._rawDebug("[AGCF_LOAD_ERROR] " + (error.stack || error)); } })'
        result = client.call('Runtime.evaluate', {'expression': expression, 'includeCommandLineAPI': True, 'returnByValue': True})
        if result.get('exceptionDetails'):
            detail = result['exceptionDetails'].get('exception', {}).get('description') or result['exceptionDetails'].get('text')
            raise InspectorError(f'Plugin runtime evaluation failed: {detail}')
        # Runtime.runIfWaitingForDebugger already releases Electron 44's
        # startup wait. The queued callback now runs on the first loop turn.
    finally:
        client.close()
