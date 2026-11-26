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

export async function searchYoutubeBacking(query, key, request=fetch) {
 const params=new URLSearchParams({part:'snippet',type:'video',videoEmbeddable:'true',
  safeSearch:'strict',maxResults:'8',q:query,key});
 let response;
 try {response=await request('https://www.googleapis.com/youtube/v3/search?'+params);}
 catch {throw Error('YouTube에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.');}
 if(response.status===403)throw Error('YouTube API 사용 설정, 사이트 주소 제한 또는 검색 할당량을 확인해 주세요.');
 if(!response.ok)throw Error('YouTube 검색에 실패했어요. API 키를 확인해 주세요.');
 const {items=[]}=await response.json();
 return items.filter(item=>/^[A-Za-z0-9_-]{11}$/.test(item.id?.videoId??''))
  .map(item=>({id:item.id.videoId,title:String(item.snippet?.title??'제목 없음'),channel:String(item.snippet?.channelTitle??'')}));
}
