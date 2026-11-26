/* Recover transient failures of the local startup page without touching chats. */
function attach(win, {setTimer=setTimeout, clearTimer=clearTimeout, log=console.warn,
  openExternal=url=>require('electron').shell.openExternal(url)}={}) {
  const contents=win.webContents;
  let target=null, timer=null, attempts=0, finished=false, closed=false, failedNavigation=false;
  const valid=url=>{
    try {const u=new URL(url);return u.protocol==='https:' && u.hostname==='127.0.0.1' && !!u.port;}
    catch (_) {return false;}
  };
  function cancel() {if(timer!==null){clearTimer(timer);timer=null;}}
  function dispose(){closed=true;cancel();}
  function start(_event,url,_inPlace,isMainFrame) {
    if(isMainFrame && valid(url) && !finished){target=url;failedNavigation=false;cancel();}
  }
  function success() {
    if(!failedNavigation && valid(contents.getURL())){finished=true;cancel();}
  }
  function failed(_event,code,_description,url,isMainFrame) {
    if(closed || finished || !isMainFrame || code===-3 || !valid(url))return;
    failedNavigation=true;
    target=url;
    cancel();
    if(attempts<3){
      const delay=[1000,2500,5000][attempts++];
      log('[StartupRecovery] Local page failed ('+code+'); retry '+attempts+'/3');
      timer=setTimer(()=>{
        timer=null;
        if(closed || finished || win.isDestroyed())return;
        contents.loadURL(target).catch(()=>{});
      },delay);
    } else {
      // Give a usable recovery screen instead of leaving a blank window.
      const safe=target.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const html='<!doctype html><meta charset="utf-8"><title>Antigravity</title>'+
        '<style>body{font:16px system-ui;background:#fafafa;color:#252525;padding:15vh 12vw;line-height:1.8}a{display:inline-block;padding:8px 20px;border:1px solid #bbb;border-radius:6px;color:#175cd3;text-decoration:none}</style>'+
        '<h2>本地页面暂时未能连接</h2><p>已自动重试三次。请稍后点击重试；这不会清除会话或文件。</p><a href="'+safe+'">重新连接</a>';
      contents.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html)).catch(()=>{});
    }
  }
  // Markdown links can otherwise replace the local app page in this window.
  // Only handle renderer navigation from our local app to a public HTTP(S) URL;
  // leave local routes and other protocols to the official application.
  function externalNavigation(event,url) {
    if(closed || !valid(contents.getURL()))return;
    let destination;
    try {destination=new URL(url);} catch (_) {return;}
    if(!['http:','https:'].includes(destination.protocol) ||
       ['127.0.0.1','localhost','[::1]'].includes(destination.hostname))return;
    event.preventDefault();
    Promise.resolve().then(()=>openExternal(destination.href)).catch(error=>
      log('[NavigationGuard] Failed to open external link:',error));
  }
  contents.on('did-start-navigation',start);
  contents.on('did-finish-load',success);
  contents.on('did-fail-load',failed);
  contents.on('will-navigate',externalNavigation);
  win.once('closed',()=>{
    dispose();
    contents.removeListener('did-start-navigation',start);
    contents.removeListener('did-finish-load',success);
    contents.removeListener('did-fail-load',failed);
    contents.removeListener('will-navigate',externalNavigation);
  });
  return {dispose};
}
module.exports={attach};
