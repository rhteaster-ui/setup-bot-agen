/**
 * WhatsApp Client Bot - Main Entry Point
 * Baileys Multi-Device with Pairing Code & Antigravity AI Engine
 * Repository: https://github.com/rhteaster-ui/setup-bot-agen
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { cleanNumber, extractMessageText } = require("./lib/utils");
const { handleIncomingMessage } = require("./lib/messageHandler");

const CONFIG_PATH = path.join(__dirname, "config.json");
const CONFIG_EXAMPLE_PATH = path.join(__dirname, "config.example.json");
const AUTH_DIR = path.join(__dirname, "session_auth");

// 1. Inisialisasi Konfigurasi
let config = {};
if (fs.existsSync(CONFIG_PATH)) {
    try {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch (e) {
        console.error("Gagal membaca config.json, menggunakan template bawaan:", e.message);
    }
} else if (fs.existsSync(CONFIG_EXAMPLE_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_EXAMPLE_PATH, "utf8"));
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (_) {}
}

// Helper prompt interaktif di terminal jika botNumber belum ada di config
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans.trim());
        });
    });
}

let isConnecting = false;
let retryCount = 0;

async function startBot() {
    if (isConnecting) return;
    isConnecting = true;

    // Pastikan direktori autentikasi siap
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
        version: [2, 3000, 1015901307],
        isLatest: true
    }));

    console.log(`[BAILEYS] Versi Baileys: v${version.join(".")} (Latest: ${isLatest})`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // Wajib false karena menggunakan alur Pairing Code
        auth: state,
        browser: ["Ubuntu", "Chrome", "124.0.0"],
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000
    });

    // 2. Alur Permintaan Pairing Code jika sesi belum teregistrasi
    if (!sock.authState.creds.registered) {
        let targetNumber = cleanNumber(config.botNumber || process.env.BOT_NUMBER);

        if (!targetNumber) {
            console.log("\n=======================================================");
            console.log("   SETUP AWAL WHATSAPP BOT CLIENT (PAIRING CODE)");
            console.log("=======================================================");
            targetNumber = await askQuestion("👉 Masukkan Nomor WhatsApp Bot Anda (contoh: 628123456789): ");
            targetNumber = cleanNumber(targetNumber);

            if (targetNumber) {
                config.botNumber = targetNumber;
                try {
                    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
                    console.log(`[CONFIG] Nomor bot tersimpan di config.json: ${targetNumber}`);
                } catch (_) {}
            }
        }

        if (targetNumber) {
            // Beri jeda 3 detik agar socket Baileys siap menerima pairing request
            setTimeout(async () => {
                try {
                    console.log(`[PAIRING] Meminta pairing code untuk nomor: +${targetNumber}...`);
                    const rawCode = await sock.requestPairingCode(targetNumber);
                    // Format kode menjadi 4-4 karakter agar mudah dibaca manusia (misal: 1234-5678)
                    const formattedCode = rawCode?.match(/.{1,4}/g)?.join("-") || rawCode;

                    console.log("\n=======================================================");
                    console.log(`🔗 KODE PAIRING WHATSAPP:  \x1b[1;32m${formattedCode}\x1b[0m`);
                    console.log("=======================================================");
                    console.log("Langkah Pairing:");
                    console.log("1. Buka aplikasi WhatsApp di ponsel Anda");
                    console.log("2. Buka menu Titik Tiga (kanan atas) > Perangkat Tertaut");
                    console.log("3. Pilih 'Tautkan Perangkat' > 'Tautkan dengan nomor telepon saja'");
                    console.log(`4. Masukkan kode: ${formattedCode}`);
                    console.log("=======================================================\n");
                } catch (err) {
                    console.error("[ERROR] Gagal mendapatkan Pairing Code:", err.message);
                    console.log("[TIPS] Pastikan nomor valid dengan kode negara dan server memiliki koneksi internet.");
                }
            }, 3000);
        } else {
            console.error("[ERROR] Nomor bot belum ditentukan. Isi config.json atau restart untuk input.");
        }
    }

    // 3. Sinkronisasi Kredensial Otentikasi
    sock.ev.on("creds.update", saveCreds);

    // 4. Update Status Koneksi Socket
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "connecting") {
            console.log("[WA] Menghubungkan ke server WhatsApp...");
        }

        if (connection === "close") {
            isConnecting = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`[WA] Koneksi terputus. Kode status: ${statusCode || "Unknown"}. Auto-reconnect: ${shouldReconnect}`);

            if (shouldReconnect) {
                retryCount++;
                const delayMs = Math.min(30000, 3000 * retryCount);
                console.log(`[WA] Mencoba menyambung kembali dalam ${delayMs / 1000} detik...`);
                setTimeout(startBot, delayMs);
            } else {
                console.log("\n[WA] Sesi telah logout atau kredensial kedaluwarsa.");
                console.log("[TIPS] Hapus folder 'session_auth' dan jalankan ulang 'npm start' untuk pairing baru.\n");
            }
        } else if (connection === "open") {
            isConnecting = false;
            retryCount = 0;
            console.log("\n=======================================================");
            console.log("✅ WHATSAPP BOT CLIENT BERHASIL TERHUBUNG DENGAN SUKSES!");
            console.log(`📱 Nomor Bot : ${config.botNumber || "Aktif"}`);
            console.log(`👑 Owner     : ${config.ownerNumber || "Belum disetel"}`);
            console.log(`🧠 AI Engine : Antigravity (${config.defaultAiModel || "gemini-3.8-flash-medium"})`);
            console.log("=======================================================\n");

            // Kirim notifikasi konfirmasi ke nomor owner jika sudah dikonfigurasi
            if (config.ownerNumber) {
                const ownerJid = `${cleanNumber(config.ownerNumber)}@s.whatsapp.net`;
                try {
                    await sock.sendMessage(ownerJid, {
                        text: `🤖 *BOT CLIENT ONLINE!*\n\nBot WhatsApp berhasil terhubung ke server VPS dan siap digunakan.\nKetik *.menu* untuk melihat daftar fitur aktif.`
                    });
                } catch (_) {}
            }
        }
    });

    // 5. Penanganan Pesan Masuk (Upsert)
    sock.ev.on("messages.upsert", async (m) => {
        if (m.type !== "notify" || !m.messages || !m.messages.length) return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const rawText = extractMessageText(msg);
        try {
            await handleIncomingMessage(sock, msg, rawText, config);
        } catch (err) {
            console.error("[HANDLER ERROR]", err);
        }
    });
}

// Tangani graceful shutdown
process.on("SIGINT", () => {
    console.log("\n[BOT] Mematikan service secara aman (SIGINT)...");
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("\n[BOT] Mematikan service secara aman (SIGTERM)...");
    process.exit(0);
});

// Eksekusi bot
startBot().catch((err) => {
    console.error("[FATAL START ERROR]", err);
});
