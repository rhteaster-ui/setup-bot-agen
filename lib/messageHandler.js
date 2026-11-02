/**
 * Message Handler & Command Router for WhatsApp Bot Client
 * Repository: https://github.com/rhteaster-ui/setup-bot-agen
 */

const { exec } = require("child_process");
const { runAgyPrompt, checkAgyStatus } = require("./agyHelper");
const { getFormattedVpsStatus } = require("./systemHelper");
const { cleanNumber } = require("./utils");

async function handleIncomingMessage(sock, msg, rawText, config) {
    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith("@g.us");
    const senderJid = msg.key.participant || remoteJid;
    const senderNum = cleanNumber(senderJid);
    const ownerNumClean = cleanNumber(config.ownerNumber);
    const isOwner = Boolean(ownerNumClean && senderNum.endsWith(ownerNumClean));
    const pushName = msg.pushName || (isOwner ? "Owner" : "User");

    const text = (rawText || "").trim();
    if (!text) return;

    const prefix = config.prefix || ".";
    const isCommand = text.startsWith(prefix);
    const cmdBody = isCommand ? text.slice(prefix.length).trim() : "";
    const [command, ...args] = cmdBody.split(/\s+/);
    const lowerCmd = (command || "").toLowerCase();
    const query = args.join(" ").trim();

    // Helper balas pesan (quote pesan masuk)
    const reply = async (content) => {
        return await sock.sendMessage(remoteJid, { text: content }, { quoted: msg });
    };

    // Helper indikator mengetik
    const sendComposing = async () => {
        if (config.typingIndicator !== false) {
            try {
                await sock.sendPresenceUpdate("composing", remoteJid);
            } catch (_) {}
        }
    };

    // Helper reaksi emoji
    const react = async (emoji) => {
        try {
            await sock.sendMessage(remoteJid, { react: { text: emoji, key: msg.key } });
        } catch (_) {}
    };

    // 1. COMMAND: .menu / .help
    if (lowerCmd === "menu" || lowerCmd === "help") {
        await react("📋");
        const menuText = `🤖 *WHATSAPP CLIENT BOT*
• *Pengguna:* ${pushName}
• *Hak Akses:* ${isOwner ? "👑 Owner (Akses Penuh)" : "👤 Tamu"}
• *Prefix:* \`${prefix}\`
• *AI Engine:* Antigravity (${config.defaultAiModel || "gemini-3.8-flash-medium"})

📌 *DAFTAR PERINTAH AKTIF:*

🧠 *KECERDASAN BUATAN (AI)*
• \`${prefix}ai <pertanyaan>\`
  Tanya jawab cerdas, problem-solving, analisa kode, dan riset.
• \`${prefix}model [nama_model]\`
  Cek atau ubah model Antigravity (khusus Owner).
• \`${prefix}agy\`
  Cek status autentikasi Google Antigravity CLI.

⚙️ *KONTROL SISTEM & VPS*
• \`${prefix}status\`
  Cek beban server (RAM, CPU Cores, Load, Disk, Uptime).
• \`${prefix}ping\`
  Tes latensi respon bot dan koneksi socket.
• \`${prefix}restart\`
  Restart service bot secara instan (khusus Owner).

🔒 *KHUSUS OWNER*
• \`${prefix}exec <command>\`
  Jalankan perintah bash terminal langsung dari chat WhatsApp.

_Ketik perintah di atas untuk langsung menggunakannya._`;
        return await reply(menuText);
    }

    // 2. COMMAND: .ping / .speed
    if (lowerCmd === "ping" || lowerCmd === "speed") {
        await react("⚡");
        const start = Date.now();
        await reply(`🏓 *Pong!*\n• Latensi respon: *${Date.now() - start} ms*\n• Socket: *Aktif*`);
        return;
    }

    // 3. COMMAND: .status / .stats / .vps
    if (lowerCmd === "status" || lowerCmd === "stats" || lowerCmd === "vps") {
        await react("📊");
        const statusMsg = getFormattedVpsStatus();
        return await reply(statusMsg);
    }

    // 4. COMMAND: .agy (Cek status Antigravity CLI)
    if (lowerCmd === "agy") {
        await react("🔍");
        const agyStatus = checkAgyStatus(config.agyBin);
        const textRes = `🤖 *STATUS ANTIGRAVITY AI ENGINE*

• *CLI Path:* \`${agyStatus.binPath}\`
• *Terpasang:* ${agyStatus.isInstalled ? "✅ Ya" : "❌ Belum terpasang"}
• *Status Login:* ${agyStatus.isLoggedIn ? "✅ Aktif (" + agyStatus.authEmail + ")" : "⚠️ Belum Login"}

${!agyStatus.isLoggedIn ? "_Jalankan perintah `agy` di terminal VPS untuk login Google sekali saja._" : "_Engine siap melayani prompt AI via WhatsApp._"}`;
        return await reply(textRes);
    }

    // 5. COMMAND: .model
    if (lowerCmd === "model") {
        if (!isOwner && query) {
            return await reply("⛔ Pengaturan model AI hanya dapat diubah oleh Owner.");
        }
        if (query) {
            config.defaultAiModel = query;
            await react("✅");
            return await reply(`✅ Model AI aktif berhasil diubah ke: \`${query}\``);
        }
        return await reply(`🧠 *MODEL AI AKTIF:* \`${config.defaultAiModel || "gemini-3.8-flash-medium"}\`\n\nUntuk mengubah model, ketik:\n\`${prefix}model gemini-3.8-pro\` atau \`${prefix}model gemini-3.8-flash-medium\``);
    }

    // 6. COMMAND: .restart
    if (lowerCmd === "restart") {
        if (!isOwner) {
            return await reply("⛔ Perintah restart hanya dapat dijalankan oleh Owner.");
        }
        await react("🔄");
        await reply("🔄 Merestart proses bot... Bot akan tersambung kembali dalam beberapa detik.");
        setTimeout(() => {
            process.exit(0);
        }, 1200);
        return;
    }

    // 7. COMMAND: .exec (Bash terminal khusus Owner)
    if (lowerCmd === "exec") {
        if (!isOwner) {
            return await reply("⛔ Akses ditolak. Fitur bash terminal hanya untuk Owner.");
        }
        if (!query) {
            return await reply(`Contoh penggunaan: \`${prefix}exec ls -la\``);
        }
        await react("⏳");
        exec(query, { timeout: 30000 }, async (err, stdout, stderr) => {
            if (err) {
                return await reply(`❌ *ERROR EXEC:*\n\`\`\`\n${err.message}\n\`\`\``);
            }
            const out = (stdout || stderr || "Perintah berhasil dijalankan tanpa pesan output.").trim();
            const maxLen = 3000;
            const truncated = out.length > maxLen ? out.substring(0, maxLen) + "\n...[output dipotong]" : out;
            await react("✅");
            await reply(`🖥️ *OUTPUT BASH:*\n\`\`\`\n${truncated}\n\`\`\``);
        });
        return;
    }

    // 8. COMMAND: .ai / .ask (atau private chat non-command)
    const shouldTriggerAi = lowerCmd === "ai" || lowerCmd === "ask" || (!isGroup && !isCommand && text.length > 2);
    if (shouldTriggerAi) {
        const promptToRun = (lowerCmd === "ai" || lowerCmd === "ask") ? query : text;
        if (!promptToRun) {
            return await reply(`Silakan masukkan pertanyaan atau instruksi Anda.\nContoh: \`${prefix}ai jelaskan arsitektur microservices\``);
        }

        await react("⏳");
        await sendComposing();

        try {
            const aiResponse = await runAgyPrompt(promptToRun, {
                model: config.defaultAiModel || "gemini-3.8-flash-medium",
                agyBin: config.agyBin || "agy"
            });
            await react("✨");
            return await reply(aiResponse);
        } catch (err) {
            await react("❌");
            return await reply(`⚠️ *Gagal memproses AI:*\n${err.message}\n\n_Pastikan Antigravity CLI (\`agy\`) sudah terpasang dan login di server VPS._`);
        }
    }
}

module.exports = {
    handleIncomingMessage
};
