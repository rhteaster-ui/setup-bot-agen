/**
 * Antigravity CLI (agy) & Gemini AI Integration Helper
 * Repository: https://github.com/rhteaster-ui/setup-bot-agen
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const DEFAULT_MODEL = "gemini-3.8-flash-medium";

function getAgyBinPath(configuredBin = "agy") {
    if (path.isAbsolute(configuredBin) && fs.existsSync(configuredBin)) {
        return configuredBin;
    }
    // Check ~/.local/bin/agy
    const userLocal = path.join(process.env.HOME || "/root", ".local", "bin", "agy");
    if (fs.existsSync(userLocal)) {
        return userLocal;
    }
    // Check /usr/local/bin/agy
    if (fs.existsSync("/usr/local/bin/agy")) {
        return "/usr/local/bin/agy";
    }
    try {
        const found = execSync(`which ${configuredBin}`, { encoding: "utf8" }).trim();
        if (found) return found;
    } catch (_) {}
    return "agy";
}

function findOAuthTokenPath() {
    const home = process.env.HOME || "/root";
    const candidatePaths = [
        path.join(home, ".gemini", "antigravity-cli", "antigravity-oauth-token"),
        path.join(home, ".gemini", "oauth-token"),
        path.join(home, ".antigravity", "oauth-token")
    ];

    for (const p of candidatePaths) {
        if (fs.existsSync(p)) return p;
    }

    // Cek di profiles jika ada
    try {
        const profilesDir = path.join(home, ".gemini", "profiles");
        if (fs.existsSync(profilesDir)) {
            const profiles = fs.readdirSync(profilesDir);
            for (const prof of profiles) {
                const subPath = path.join(profilesDir, prof, ".gemini", "antigravity-cli", "antigravity-oauth-token");
                if (fs.existsSync(subPath)) return subPath;
            }
        }
    } catch (_) {}

    return candidatePaths[0];
}

function checkAgyStatus(agyBin = "agy") {
    const binPath = getAgyBinPath(agyBin);
    const tokenPath = findOAuthTokenPath();
    const isInstalled = Boolean(binPath && (fs.existsSync(binPath) || binPath === "agy"));
    const isAuthTokenExist = fs.existsSync(tokenPath);

    let authEmail = null;
    if (isAuthTokenExist) {
        try {
            const data = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
            authEmail = data.id_token_email || data.email || "Akun Terverifikasi";
        } catch (_) {
            authEmail = "Token Terdeteksi";
        }
    }

    return {
        binPath,
        isInstalled,
        isLoggedIn: isAuthTokenExist,
        authEmail
    };
}

/**
 * Execute AI prompt via agy print mode
 */
function runAgyPrompt(prompt, options = {}) {
    const model = options.model || DEFAULT_MODEL;
    const agyBin = getAgyBinPath(options.agyBin || "agy");
    const timeoutMs = options.timeoutMs || 90000;

    return new Promise((resolve, reject) => {
        const args = [
            "--model", model,
            "-p", prompt,
            "--dangerously-skip-permissions"
        ];

        const env = {
            ...process.env,
            PATH: `${path.join(process.env.HOME || "/root", ".local", "bin")}:/usr/local/bin:${process.env.PATH || ""}`
        };

        const child = spawn(agyBin, args, { env });
        let stdout = "";
        let stderr = "";

        const timer = setTimeout(() => {
            child.kill("SIGKILL");
            reject(new Error("Batas waktu eksekusi AI terlampaui (90 detik)."));
        }, timeoutMs);

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("close", (code) => {
            clearTimeout(timer);
            if (code !== 0 && !stdout.trim()) {
                const errDetail = stderr.trim() || `Exit code ${code}`;
                return reject(new Error(`Antigravity Error: ${errDetail}`));
            }
            resolve(stdout.trim() || "Tidak ada respon teks dari AI.");
        });

        child.on("error", (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

module.exports = {
    getAgyBinPath,
    checkAgyStatus,
    runAgyPrompt
};
