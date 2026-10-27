# Kaizen Anime

Aplikasi Android katalog anime dengan tema gelap hitam-ungu, menggunakan AniList GraphQL API untuk metadata anime. Dibungkus menjadi APK melalui Capacitor dan GitHub Actions sehingga bisa dikembangkan dari HP.

## Fitur versi awal
- Katalog anime populer dan pencarian judul
- Poster, skor, genre, tahun, detail, dan deskripsi
- Simpan favorit di perangkat
- Tautan penyedia resmi jika tersedia di data eksternal AniList
- Build APK debug otomatis dari GitHub Actions

## Catatan streaming
AniList menyediakan metadata katalog, bukan file video. Aplikasi ini tidak meng-host atau mengekstrak video. Tautan tontonan hanya diarahkan ke penyedia resmi/berlisensi jika tersedia; ketersediaan bergantung wilayah dan lisensi. Jangan menambahkan sumber video tanpa izin.

## Build dari HP Android
1. Unduh ZIP project ini dan ekstrak, atau upload semua file ke repositori GitHub.
2. Buat repositori bernama `kaizen-anime` di akun GitHub `Kaizenhub-2305`.
3. Upload isi folder project ke repositori (pastikan folder `.github/workflows` ikut ter-upload).
4. Buka tab **Actions** pada repositori. Jika diminta, aktifkan GitHub Actions.
5. Pilih workflow **Build Kaizen Anime APK** lalu tekan **Run workflow**. Atau lakukan commit ke branch `main`.
6. Setelah job selesai, buka run yang hijau dan unduh artifact `kaizen-anime-debug-apk`.
7. Ekstrak artifact ZIP dan instal `app-debug.apk` di HP. Android mungkin meminta izin instal aplikasi dari sumber ini.

## Catatan
- Ini APK debug untuk pengujian, belum APK rilis bertanda tangan untuk distribusi publik.
- Untuk rilis publik, buat signing key pribadi dan simpan rahasia signing di GitHub Actions Secrets; jangan pernah commit ke repo.
- AniList API: https://docs.anilist.co/guide/graphql/
