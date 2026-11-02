# 🤖 WhatsApp Bot Client (Baileys + Antigravity AI Engine)

Template bot WhatsApp client mandiri siap pakai untuk VPS Linux. Mendukung autentikasi modern menggunakan **Pairing Code 8-Digit** (tanpa ribet scan QR terminal) serta integrasi kecerdasan buatan **Google Antigravity (`agy` / Gemini 3.8 Flash & Pro)**.

Repositori Resmi: [https://github.com/rhteaster-ui/setup-bot-agen](https://github.com/rhteaster-ui/setup-bot-agen)

---

## ⚡ Fitur Utama

- **Pairing Code WhatsApp:** Tidak perlu scan QR di layar terminal. Cukup masukkan nomor bot di terminal dan input 8 digit kode langsung di menu *Perangkat Tertaut* WhatsApp.
- **Auto Reconnect & Multi-Device:** Otomatis menyambung kembali saat koneksi terputus.
- **AI Antigravity Engine:** Integrasi native CLI `agy` untuk eksekusi tanya jawab cerdas, coding, riset, dan analisis teks via `.ai <pertanyaan>`.
- **Manajemen Server dari WhatsApp:**
  - `.status` : Pantau beban VPS (RAM, CPU Cores, Load Avg, Disk usage, Uptime server & bot).
  - `.ping` : Cek latency respon bot dan status koneksi socket.
  - `.restart` : Restart bot dari chat tanpa perlu login SSH ulang.
  - `.exec <bash>` : Jalankan perintah terminal langsung dari chat WhatsApp (khusus Owner).
  - `.agy` : Periksa status instalasi dan autentikasi akun Google Antigravity.
  - `.model` : Cek atau ganti model AI Gemini aktif.
- **Background Runner (PM2):** Menjaga bot tetap hidup 24/7 dengan restart otomatis jika terjadi crash atau server reboot.

---

## 🚀 Panduan Instalasi Cepat (One-Line Setup)

Jalankan perintah one-liner berikut di terminal VPS Linux Anda (Ubuntu/Debian):

```bash
curl -sL https://raw.githubusercontent.com/rhteaster-ui/setup-bot-agen/main/setup.sh | bash
```

*Perintah di atas otomatis mengunduh repositori `setup-bot-agen`, memasang dependensi sistem, Node.js v20 LTS, PM2, dan Antigravity CLI.*

---

## 🛠️ Instalasi Manual (Git Clone)

Jika Anda ingin meng-clone dan meninjau source code secara manual:

```bash
# 1. Clone repositori
git clone https://github.com/rhteaster-ui/setup-bot-agen.git

# 2. Masuk ke direktori
cd setup-bot-agen

# 3. Jalankan script setup
bash setup.sh
```

---

## 📱 Langkah Pairing WhatsApp (Pertama Kali)

1. Jalankan bot di mode interaktif:
   ```bash
   npm start
   ```
2. Terminal akan menanyakan nomor bot Anda jika belum dikonfigurasi di `config.json` (format internasional, contoh: `628123456789`).
3. Dapatkan **8-digit Pairing Code** di layar terminal:
   ```text
   =======================================================
   🔗 KODE PAIRING WHATSAPP:  ABCD-1234
   =======================================================
   ```
4. Buka aplikasi WhatsApp di HP Anda:
   - Pilih menu **Titik Tiga** (kanan atas) > **Perangkat Tertaut** (*Linked Devices*).
   - Ketuk tombol **Tautkan Perangkat** (*Link a Device*).
   - Pilih opsi **Tautkan dengan nomor telepon saja** (*Link with phone number instead*) di bagian bawah layar.
   - Masukkan 8 digit kode yang tampil di terminal.
5. Setelah status menampilkan `✅ WHATSAPP BOT CLIENT BERHASIL TERHUBUNG!`, matikan proses interaktif dengan menekan `Ctrl + C`.

---

## 🔄 Menjalankan Bot 24/7 di Background (PM2)

Setelah proses pairing berhasil tersimpan di folder `session_auth`, jalankan bot menggunakan PM2 agar terus berjalan tanpa perlu membuka terminal SSH:

```bash
# 1. Jalankan bot dengan PM2
npm run pm2:start

# 2. Simpan proses agar otomatis berjalan saat VPS reboot
pm2 save
pm2 startup
```

### Perintah Pemeliharaan PM2:
- `npm run pm2:logs` : Memantau log aktivitas dan interaksi bot secara real-time.
- `npm run pm2:restart` : Merestart service bot.
- `npm run pm2:stop` : Menghentikan service bot.

---

## ⚙️ Konfigurasi (`config.json`)

File `config.json` otomatis dibuat dari `config.example.json`:

```json
{
  "botNumber": "628123456789",
  "ownerNumber": "628987654321",
  "prefix": ".",
  "defaultAiModel": "gemini-3.8-flash-medium",
  "agyBin": "agy",
  "typingIndicator": true
}
```

| Parameter | Deskripsi |
| :--- | :--- |
| `botNumber` | Nomor WhatsApp yang digunakan bot (tanpa tanda `+` atau spasi). |
| `ownerNumber` | Nomor WhatsApp pribadi Anda sebagai Owner dengan hak akses penuh (`.exec`, `.restart`, `.model`). |
| `prefix` | Awalan perintah bot (default: `.`). |
| `defaultAiModel` | Model Antigravity aktif (contoh: `gemini-3.8-flash-medium`, `gemini-3.8-pro`). |
| `agyBin` | Binary Antigravity CLI (default: `agy`). |
| `typingIndicator` | Status `typing...` saat AI sedang berpikir. |

---

## 🧠 Autentikasi Google Antigravity (`agy`)

Untuk mengaktifkan fitur AI:
1. Ketik perintah `agy` di terminal VPS Anda.
2. Buka tautan otentikasi Google yang muncul di browser HP/laptop Anda.
3. Setelah login Google disetujui, AI bot langsung aktif dan dapat diajak berdiskusi via WhatsApp dengan mengetik `.ai <pertanyaan>`.

---

## 📋 Daftar Perintah Bot

| Perintah | Deskripsi | Hak Akses |
| :--- | :--- | :--- |
| `.menu` / `.help` | Menampilkan ringkasan menu dan fitur | Semua Pengguna |
| `.ping` | Mengecek kecepatan respon bot & server | Semua Pengguna |
| `.status` | Mengecek beban RAM, CPU, Disk, dan Uptime VPS | Semua Pengguna |
| `.ai <pertanyaan>` | Tanya jawab cerdas ditenagai Antigravity AI | Semua Pengguna |
| `.agy` | Mengecek status koneksi akun Google Antigravity | Semua Pengguna |
| `.model [nama]` | Melihat atau mengganti model AI yang aktif | Owner |
| `.exec <command>` | Menjalankan bash command di VPS langsung dari chat | Owner |
| `.restart` | Merestart service bot dari chat WhatsApp | Owner |

---

## 🔒 Keamanan & Praktik Terbaik

- **Pemisahan Kredensial:** Folder sesi (`session_auth`) dan file konfigurasi privat (`config.json`) secara otomatis diabaikan oleh `.gitignore` sehingga tidak akan bocor ke GitHub.
- **Proteksi Eksekusi:** Perintah `.exec` hanya merespon nomor yang terdaftar di `ownerNumber`.
- **User Non-Root:** Disarankan menjalankan bot ini di bawah user Linux non-root terisolasi demi keamanan server produksi.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
Dikembangkan oleh [rhteaster-ui](https://github.com/rhteaster-ui).
