PASANG DI VERCEL TANPA SQL (Firebase Realtime Database + Vercel)
1. console.firebase.google.com > Add project (analytics boleh dimatikan).
2. Build > Realtime Database > Create Database (pilih lokasi, mode terkunci).
3. Tab Rules > tempel isi firebase-rules.json > Publish.
4. Tab Data: salin URL di bagian atas lalu tempel ke config.js (menggantikan URL contoh).
5. Unggah SEMUA file di folder ini ke repo GitHub baru (tanpa subfolder).
6. vercel.com > Add New > Project > pilih repo > Framework Preset: Other > Deploy (tanpa build).

HALAMAN PEMAIN
  index.html          permainan
  login.html          masuk
  daftar.html         pendaftaran akun
  lupa.html           reset password (email + nomor telepon)
  panduan.html        panduan penggunaan

HALAMAN ADMIN (masuk sekali, berlaku di semua halaman admin selama tab terbuka; password awal admin123)
  admin.html                   Dashboard
  admin-pemain.html            Pemain dan chip
  admin-pengguna.html          Data pengguna
  admin-pendaftaran.html       Persetujuan dan pengaturan pendaftaran
  admin-chat.html              Chat dengan pemain
  admin-tampilan.html          Tema dan tampilan
  admin-halaman-masuk.html     Teks halaman masuk/daftar
  admin-aturan.html            Aturan permainan
  admin-aktivitas.html         Log aktivitas
  admin-keamanan.html          Ganti password admin

BERKAS PENDUKUNG: app.js, auth.js, common.js, site.css, config.js, wheel3d.js (roda 3D)
