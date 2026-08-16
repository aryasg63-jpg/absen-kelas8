const CACHE='absen-v5'; // dinaikkan supaya cache lama di HP pengguna otomatis dibuang
const FILES=[
  '/absen-kelas8/index.html',
  '/absen-kelas8/admin.html',
  '/absen-kelas8/admin2.html',
  '/absen-kelas8/login.html',
  '/absen-kelas8/wali.html'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.hostname.includes('firebase')||url.hostname.includes('google')||url.hostname.includes('gstatic')||url.hostname.includes('googleapis'))return;

  // Halaman HTML (navigasi) -> selalu coba ambil versi TERBARU dari server dulu.
  // Cache cuma dipakai sebagai cadangan kalau lagi offline. Ini penting supaya
  // perbaikan tampilan/bug langsung kelihatan begitu online, tanpa perlu reload 2x.
  if(e.request.mode==='navigate'||url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(e.request).then(res=>{
        if(res&&res.status===200){const clone=res.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}
        return res;
      }).catch(()=>caches.match(e.request).then(cached=>cached||caches.match('/absen-kelas8/index.html')))
    );
    return;
  }

  // File lain (gambar, dst) -> cache-first spt semula, cukup aman & lebih cepat.
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached){fetch(e.request).then(res=>{if(res&&res.status===200)caches.open(CACHE).then(c=>c.put(e.request,res));}).catch(()=>{});return cached;}
      return fetch(e.request).then(res=>{if(res&&res.status===200){const clone=res.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}return res;}).catch(()=>caches.match('/absen-kelas8/index.html'));
    })
  );
});