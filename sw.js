const CACHE='absen-v3';
const FILES=[
  '/absen-kelas8/index.html',
  '/absen-kelas8/admin.html',
  '/absen-kelas8/login.html'
];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  // Hanya cache GET request ke file lokal kita
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);

  // Firebase & Google APIs: network only, jangan di-cache
  if(url.hostname.includes('firebase')||
     url.hostname.includes('google')||
     url.hostname.includes('gstatic')||
     url.hostname.includes('googleapis')){
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached){
        // Kembalikan cache, update di background
        fetch(e.request).then(res=>{
          if(res&&res.status===200){
            caches.open(CACHE).then(c=>c.put(e.request,res));
          }
        }).catch(()=>{});
        return cached;
      }
      // Tidak ada cache, coba network
      return fetch(e.request).then(res=>{
        if(res&&res.status===200){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      }).catch(()=>caches.match('/absen-kelas8/index.html'));
    })
  );
});
