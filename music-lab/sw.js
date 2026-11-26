const CACHE='music-lab-beta3-rc2';
const piano=[...Array.from({length:21},(_,i)=>36+3*i),99,102].map(n=>`./assets/piano/${n}.mp3`);
const ASSETS=['./','./index.html','./src/app.js','./src/app.js?v=beta3-rc2','./src/music.js','./src/audio.js','./src/mic.js','./src/style.css','./src/style.css?v=beta3-rc2','./src/staff.js','./src/midi.js','./src/larynx3d.js','./src/recorder.js','./src/vocal-content.js','./src/voice-metrics.js','./src/pitch-guide.js','./src/guitar-lab.js','./src/chord-library.js','./src/guitar-theory.js','./src/chromatic.js','./src/chord-progression.js','./src/metronome.js','./src/studio-engine.js','./src/backing-track.js','./src/backing-export.js','./src/rhythm-training.js','./src/practice-plan.js','./src/midi-import.js','./src/guitar-sound.js','./src/problem-engine.js','./src/problem-engine-v2.js','./src/problem-engine-v3.js','./src/theory-questions.js','./src/theory-verifier.js','./src/advanced-questions.js','./assets/treble-clef.svg','./assets/bass-clef.svg','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png','./manifest.webmanifest',...piano];
const scoped = new URL(self.registration.scope);
const urls = new Set(ASSETS.map(asset=>new URL(asset,scoped).href));
self.addEventListener('install', event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate', event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys
  .filter(key=>key.startsWith('music-lab-')&&key!==CACHE)
  .map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event=>{
 const {request}=event;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==scoped.origin||!url.pathname.startsWith(scoped.pathname))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>{
   const cache=await caches.open(CACHE);
   return await cache.match(new URL('index.html',scoped))??Response.error();
  }));
 }else if(urls.has(url.href)){
  event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(request)??fetch(request)));
 }
});
