/**
 * System and VPS resource monitoring helper
 */

const os = require("os");
const { execSync } = require("child_process");
const { formatBytes, formatUptime } = require("./utils");

function getVpsStatus() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

    const cpus = os.cpus();
    const cpuModel = cpus && cpus[0] ? cpus[0].model.trim() : "Unknown CPU";
    const cpuCores = cpus ? cpus.length : 1;

    let diskInfo = "N/A";
    try {
        const dfOut = execSync("df -h / | awk 'NR==2 {print $3 \" / \" $2 \" (\" $5 \")\"}'", { encoding: "utf8" }).trim();
        if (dfOut) diskInfo = dfOut;
    } catch (_) {}

    const loadAvg = os.loadavg().map(v => v.toFixed(2)).join(", ");
    const uptimeSys = formatUptime(os.uptime());
    const uptimeProcess = formatUptime(process.uptime());

    return {
        platform: `${os.type()} ${os.arch()}`,
        nodeVersion: process.version,
        cpuModel,
        cpuCores,
        loadAvg,
        ramUsed: formatBytes(usedMem),
        ramTotal: formatBytes(totalMem),
        ramUsagePercent,
        diskInfo,
        uptimeSys,
        uptimeProcess
    };
}

function getFormattedVpsStatus() {
    const s = getVpsStatus();
    return `📊 *STATUS KESEHATAN VPS & BOT*

• *OS / Arch:* ${s.platform}
• *Node.js:* ${s.nodeVersion}
• *CPU:* ${s.cpuModel} (${s.cpuCores} Core)
• *Load Avg:* ${s.loadAvg}
• *RAM Usage:* ${s.ramUsed} / ${s.ramTotal} (${s.ramUsagePercent}%)
• *Disk Usage (/):* ${s.diskInfo}
• *Uptime Server:* ${s.uptimeSys}
• *Uptime Bot:* ${s.uptimeProcess}

⚡ _Server berjalan normal dan responsif._`;
}

module.exports = {
    getVpsStatus,
    getFormattedVpsStatus
};
