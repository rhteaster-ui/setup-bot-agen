/**
 * Utility functions for WhatsApp Client Bot
 */

function cleanNumber(phone) {
    if (!phone) return "";
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
        clean = "62" + clean.substring(1);
    }
    return clean;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatUptime(uptimeSeconds) {
    const sec = Math.floor(uptimeSeconds % 60);
    const min = Math.floor((uptimeSeconds / 60) % 60);
    const hour = Math.floor((uptimeSeconds / 3600) % 24);
    const day = Math.floor(uptimeSeconds / 86400);

    const parts = [];
    if (day > 0) parts.push(`${day}h`);
    if (hour > 0) parts.push(`${hour}j`);
    if (min > 0) parts.push(`${min}m`);
    parts.push(`${sec}d`);
    return parts.join(" ");
}

function extractMessageText(msg) {
    if (!msg || !msg.message) return "";
    const m = msg.message;

    // ViewOnce unwrapping
    const actual = m.viewOnceMessage?.message ||
                   m.viewOnceMessageV2?.message ||
                   m.viewOnceMessageV2Extension?.message ||
                   m;

    // Interactive button replies
    const btnJson = actual.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
    if (btnJson) {
        try {
            const parsed = JSON.parse(btnJson);
            return parsed.id || parsed.rowId || parsed.selectedId || parsed.title || "";
        } catch (_) {}
    }

    const templateBtnId = actual.templateButtonReplyMessage?.selectedId ||
                          actual.buttonsResponseMessage?.selectedButtonId ||
                          actual.listResponseMessage?.singleSelectReply?.selectedRowId ||
                          actual.interactiveResponseMessage?.body?.text;
    if (templateBtnId) return templateBtnId;

    return actual.conversation ||
           actual.extendedTextMessage?.text ||
           actual.imageMessage?.caption ||
           actual.videoMessage?.caption ||
           actual.documentMessage?.caption ||
           "";
}

module.exports = {
    cleanNumber,
    formatBytes,
    formatUptime,
    extractMessageText
};
