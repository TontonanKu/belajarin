# 🎓 KUIS SEKOLAH TIKTOK LIVE (6 MATA PELAJARAN)

Aplikasi game kuis interaktif edukasi yang terintegrasi langsung dengan **TikTok Live**, dibuat khusus untuk live streaming dengan tampilan **Estetika Buku Catatan Belajar / Jurnal Lapangan Akademis (Editorial Notebook & Stationery 9:16)**.

---

## 🌟 Fitur Utama Terbaru

1. **Sistem Banyak Pemenang Sampai Waktu Habis (*Multi-Winner*)**:
   - **Bukan hanya 1 orang!** Seluruh penonton di live chat bisa ikut menjawab sampai batas waktu hitung mundur benar-benar habis (0 detik).
   - **Juara 1 (Tercepat)**: Mendapat gelar **`⚡ JUARA 1 TERCEPAT`** dengan bonus poin ekstra 50% + bonus kombo!
   - **Penjawab ke-2, ke-3, dst**: Tetap mendapatkan poin penuh dan stempel status `✓ BENAR` di lembar jawaban tebakan chat.

2. **Perhitungan Gift Koin: 1 Koin = +20 Detik**:
   - Setiap kali penonton mengirimkan Gift TikTok, sistem menghitung berdasarkan nilai koinnya:
     - 🌹 **1 Mawar (1 Koin)** = **+20 Detik** waktu soal bertambah!
     - 🍩 **1 Donut (30 Koin)** = **+600 Detik (10 Menit)** waktu kuis bertambah!
   - Disertai animasi koin melayang emas `🪙 +20s!` dan audio fanfare kemeriahan gift!

3. **Rotasi 6 Mata Pelajaran + Scene Jeda Juara Kelas Harian (Senin - Minggu)**:
   - Kuis berganti mata pelajaran setiap 1 jam (3600 detik):
     1. 🌍 **IPS** (Ilmu Pengetahuan Sosial - Sejarah, Geografi, Budaya)
     2. 🔬 **IPA** (Ilmu Pengetahuan Alam - Biologi, Sains, Tata Surya)
     3. 📐 **MTK** (Matematika - Hitung Cepat, Geometri, Tebak Angka)
     4. 📖 **BAHASA INDONESIA** (Peribahasa, Sastra, Antonim & Sinonim)
     5. ⚡ **FISIKA** (Hukum Newton, Satuan SI, Energi, Penemu)
     6. ⚽ **PJOK** (Pendidikan Jasmani Olahraga & Kesehatan)
   - **Scene Jeda Istirahat (Intermission)**: Setiap pergantian mapel, overlay berganti scene dengan suara lonceng sekolah 🔔, menampilkan:
     - **Top 5 Juara Kelas per Hari (Senin - Minggu)** lengkap dengan medali 🥇🥈🥉, foto profil, dan poin.
     - Jadwal mata pelajaran berikutnya & hitung mundur jeda masuk kelas (30 detik).
     - Otomatis mengarsipkan top 5 live murid hari ini ke rekap hari berjalan.

4. **Dewan Sultan / Top Spender Koin (Permanen & Tidak Pernah Reset)**:
   - Papan kehormatan donatur gift koin tertinggi yang bersifat **abadi**:
     - **Tidak akan terhapus** saat tombol reset kuis diklik.
     - Posisi peringkat hanya akan berubah jika disalip/dibalap oleh penonton lain yang memberikan koin lebih banyak (*"Berubah Jika Dibalap"*).
     - **Mini Pill Sultan #1**: Tampil di header strip kuis utama agar penonton terpicu untuk membalap takhta.
     - **Banner Notifikasi Balap Takhta (🚨 DIBALAP!)**: Pop-up animasi seru dan suara terompet kemenangan saat seorang penonton berhasil menyalip posisi sultan lain!

5. **Desain Menarik & Gamified (Catatan Sekolah / Editorial Stationery)**:
   - **Top 10 Klasemen Siswa**: Tampilan lencana juara 1 (Gold 🥇 dengan mahkota 👑 dan combo api 🔥), juara 2 (Silver 🥈), dan juara 3 (Bronze 🥉).
   - **Lembar Jawaban Live Chat**: Desain gelembung chat interaktif dengan foto profil penonton, stempel merah `[ ✓ BENAR +XX ]` dan stempel pensil `[ ✗ SALAH ]`.
   - **Dock Uji Coba Langsung di Layar**: Di bagian bawah overlay ada dock uji coba untuk tes suara, auto-jawab, dan kirim tebakan tanpa harus berpindah jendela!

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Script Otomatis (Windows)
Cukup klik dua kali file **`start.bat`** di folder ini. Browser akan otomatis terbuka.

### Cara 2: Menggunakan Terminal / Command Prompt
```bash
# Jalankan server
npm start
```
Buka browser di:
- **Halaman Utama / Launcher**: `http://localhost:3050`
- **Tampilan Overlay (OBS Studio)**: `http://localhost:3050/overlay.html`
- **Dashboard Kontrol & Simulator**: `http://localhost:3050/admin.html`

---

## 🎬 Cara Memasang di OBS Studio / TikTok Live Studio

1. Buka **OBS Studio** atau **TikTok Live Studio**.
2. Pada bagian **Sources** (Sumber), klik tombol **+** dan pilih **Browser** (Peramban).
3. Beri nama (misal: `Kuis IPS Overlay`).
4. Atur pengaturan berikut:
   - **URL**: `http://localhost:3050/overlay.html`
   - **Width (Lebar)**: `1080`
   - **Height (Tinggi)**: `1920`
5. Klik **OK**. Overlay kuis siap disiarkan!

---

## 📂 Struktur File

```
ilmu-pengetahuan-sosial/
├── package.json          # Dependensi (express, socket.io, tiktok-live-connector, cors)
├── server.js             # Engine server utama, state game, konektor TikTok & WebSocket
├── questions.json        # 100+ database soal kuis IPS
├── start.bat             # Shortcut sekali klik untuk Windows
├── public/
│   ├── index.html        # Portal Launcher & informasi kuis
│   ├── overlay.html      # Tampilan overlay streaming 9:16 untuk OBS
│   ├── overlay.css       # Desain modern, glassmorphism, animasi neon & partikel
│   ├── overlay.js        # Logic overlay, sintesis suara Web Audio, confetti
│   ├── admin.html        # Dashboard kontrol streamer & test simulator
│   ├── admin.css         # Styling dashboard kontrol
│   └── admin.js          # Logic kontrol & simulasi
└── data/
    ├── leaderboard.json      # Penyimpanan skor kuis sesi saat ini (dapat di-reset)
    ├── top_spenders.json     # Papan kehormatan Dewan Sultan (abadi & tidak pernah reset)
    └── daily_champions.json  # Rapor Top 5 Juara Kelas harian (Senin - Minggu)
```
