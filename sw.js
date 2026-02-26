const CACHE_VERSION='ascensao-build4-v1';
const CORE=[
  './','./index.html','./styles.css','./manifest.json','./404.html',
  './data/mentor_index.json','./data/lore_index.json','./data/templates.json','./data/plans.json',
  './data/protocols.json','./data/contracts.json'
];
self.addEventListener('install',(e)=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE_VERSION);
    await c.addAll(CORE);
    self.skipWaiting();
  })());
});
self.addEventListener('activate',(e)=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});
self.addEventListener('fetch',(e)=>{
  const req=e.request;
  if(req.method!=='GET') return;
  e.respondWith((async()=>{
    const url=new URL(req.url);
    if(url.origin!==self.location.origin) return fetch(req);
    const isNav = req.mode==='navigate' || (req.headers.get('accept')||'').includes('text/html');
    const cached=await caches.match(req);
    if(cached){
      if(url.pathname.endsWith('.json')){
        e.waitUntil((async()=>{
          try{
            const res=await fetch(req);
            const c=await caches.open(CACHE_VERSION);
            c.put(req,res.clone());
          }catch{}
        })());
      }
      return cached;
    }
    try{
      const res=await fetch(req);
      const ct=res.headers.get('content-type')||'';
      if(ct.includes('text/')||ct.includes('javascript')||ct.includes('json')||ct.includes('css')){
        const c=await caches.open(CACHE_VERSION);
        c.put(req,res.clone());
      }
      return res;
    }catch(err){
      if(isNav){
        const c=await caches.open(CACHE_VERSION);
        return (await c.match('./index.html')) || new Response('Offline',{status:200});
      }
      throw err;
    }
  })());
});
