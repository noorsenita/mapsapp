const NAMA_CACHE = 'mapsapp-v2';
const ASET_CACHE = ['/', '/index.html', '/bundle.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

// Event Install - Cache aset statis
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Menginstall...');
  event.waitUntil(
    caches
      .open(NAMA_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Menyimpan aset ke cache');
        return cache.addAll(ASET_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[Service Worker] Gagal cache:', err))
  );
});

// Event Activate - Hapus cache lama
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Mengaktifkan...');
  event.waitUntil(
    caches
      .keys()
      .then((daftarCache) => {
        return Promise.all(
          daftarCache.map((nama) => {
            if (nama !== NAMA_CACHE) {
              console.log('[Service Worker] Menghapus cache lama:', nama);
              return caches.delete(nama);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Event Fetch - Network first, fallback to cache
// PENTING: Skip request ke API eksternal untuk menghindari error CORS
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (!event.request.url.startsWith('http')) return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(NAMA_CACHE).then((cache) => {
          // Hanya cache request yang berhasil
          if (response.status === 200) {
            cache.put(event.request, responseClone);
          }
        });
        return response;
      })
      .catch(() => {
        // Jika offline, ambil dari cache
        return caches.match(event.request);
      })
  );
});

// Event Push - Menampilkan notifikasi
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push diterima');

  let dataNotif = {
    title: '📍 Cerita Baru!',
    options: {
      body: 'Ada cerita baru di MapsApp!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'mapsapp-notif',
      requireInteraction: false,
      data: { url: '/#/home' },
      actions: [
        { action: 'lihat', title: '👁️ Lihat' },
        { action: 'tutup', title: '❌ Tutup' },
      ],
    },
  };

  // Parse data dari push jika ada
  if (event.data) {
    try {
      const payload = event.data.json();

      if (payload.title) {
        dataNotif.title = payload.title;
      }

      if (payload.options) {
        dataNotif.options = {
          ...dataNotif.options,
          ...payload.options,
        };
      }

      console.log('[Service Worker] Data notifikasi:', dataNotif);
    } catch (e) {
      console.error('[Service Worker] Gagal parse data push:', e);
      dataNotif.title = event.data.text() || dataNotif.title;
    }
  }

  event.waitUntil(self.registration.showNotification(dataNotif.title, dataNotif.options));
});

// Event Notification Click - Handle klik notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notifikasi diklik:', event.action);
  event.notification.close();

  if (event.action === 'lihat' || !event.action) {
    const urlTujuan = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((daftarClient) => {
        // Fokus ke window yang sudah ada jika ada
        for (let client of daftarClient) {
          if (client.url.includes(urlTujuan) && 'focus' in client) {
            return client.focus();
          }
        }
        // Buka window baru jika tidak ada
        if (clients.openWindow) {
          return clients.openWindow(urlTujuan);
        }
      })
    );
  }
});
