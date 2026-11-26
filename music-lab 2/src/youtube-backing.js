export function parseYoutubeBacking(value) {
 let url;
 try { url=new URL(String(value).trim()); } catch { return null; }
 if(url.protocol!=='https:'&&url.protocol!=='http:')return null;
 const host=url.hostname.toLowerCase();
 let id;
 if(host==='youtu.be')id=/^\/([^/]+)\/?$/.exec(url.pathname)?.[1];
 else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(host)){
  id=url.pathname==='/watch'?url.searchParams.get('v'):/^\/(?:shorts|live|embed)\/([^/]+)\/?$/.exec(url.pathname)?.[1];
 }
 if(!id||!/^[A-Za-z0-9_-]{11}$/.test(id))return null;
 const time=url.searchParams.get('t')??url.searchParams.get('start')??'';
 const match=/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(time);
 const seconds=/^\d+$/.test(time)?Number(time):match?Number(match[1]??0)*3600+Number(match[2]??0)*60+Number(match[3]??0):0;
 return {id,start:Number.isSafeInteger(seconds)?seconds:0};
}
