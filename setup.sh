#!/usr/bin/env bash

# ==============================================================================
# SCRIPT SETUP OTOMATIS WHATSAPP BOT CLIENT + ANTIGRAVITY AI
# Repositori : https://github.com/rhteaster-ui/setup-bot-agen
# Target OS  : Ubuntu / Debian Linux VPS
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}${BOLD}   INSTALASI & SETUP WHATSAPP BOT CLIENT (BAILEYS)    ${NC}"
echo -e "${BLUE}   Powered by Google Antigravity & Gemini AI Engine   ${NC}"
echo -e "${BLUE}======================================================${NC}"

REPO_URL="https://github.com/rhteaster-ui/setup-bot-agen.git"
INSTALL_DIR="setup-bot-agen"

# Deteksi jika dijalankan via curl/pipe dan bukan di dalam folder repo
if [ ! -f "package.json" ]; then
    echo -e "\n${YELLOW}[Info] Mendownload repositori setup-bot-agen...${NC}"
    if ! command -v git >/dev/null 2>&1; then
        sudo apt update -y && sudo apt install -y git
    fi
    if [ ! -d "$INSTALL_DIR" ]; then
        git clone "$REPO_URL" "$INSTALL_DIR"
    fi
    cd "$INSTALL_DIR"
    echo -e "${GREEN}Berpindah ke direktori: $(pwd)${NC}"
fi

# 1. Update paket & dependensi dasar
echo -e "\n${YELLOW}[1/5] Memeriksa dependensi sistem (curl, git, build-essential)...${NC}"
sudo apt update -y
sudo apt install -y curl git build-essential

# 2. Periksa / Pasang Node.js v20 LTS
echo -e "\n${YELLOW}[2/5] Memeriksa instalasi Node.js...${NC}"
if ! command -v node >/dev/null 2>&1; then
    echo -e "${BLUE}Node.js belum terdeteksi. Memasang Node.js v20 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    NODE_VER=$(node -v)
    echo -e "${GREEN}Node.js sudah terpasang: ${NODE_VER}${NC}"
fi

# 3. Periksa / Pasang PM2
echo -e "\n${YELLOW}[3/5] Memeriksa instalasi PM2...${NC}"
if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${BLUE}Memasang PM2 process manager...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}PM2 sudah terpasang: $(pm2 -v)${NC}"
fi

# 4. Periksa / Pasang Antigravity CLI (agy)
echo -e "\n${YELLOW}[4/5] Memeriksa Antigravity CLI (agy)...${NC}"
if ! command -v agy >/dev/null 2>&1 && [ ! -f "$HOME/.local/bin/agy" ]; then
    echo -e "${BLUE}Mengunduh dan memasang Antigravity CLI...${NC}"
    curl -fsSL https://antigravity.google/cli/install.sh | bash || true
    export PATH="$HOME/.local/bin:$PATH"
    if ! grep -qxF 'export PATH="$HOME/.local/bin:$PATH"' "$HOME/.bashrc"; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    fi
    echo -e "${GREEN}Antigravity CLI berhasil dipasang.${NC}"
else
    echo -e "${GREEN}Antigravity CLI (agy) sudah tersedia.${NC}"
fi

# 5. Pasang dependensi project Node.js
echo -e "\n${YELLOW}[5/5] Memasang dependensi project (Baileys, Pino)...${NC}"
npm install

# Buat folder logs & session_auth jika belum ada
mkdir -p logs session_auth

# Salin config jika belum ada
if [ ! -f "config.json" ]; then
    cp config.example.json config.json
    echo -e "${BLUE}File config.json berhasil dibuat dari config.example.json.${NC}"
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}${BOLD}          INSTALASI SELESAI DENGAN SUKSES!            ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Langkah Selanjutnya:"
echo -e "1. Jalankan pertama kali untuk pairing code WhatsApp:"
echo -e "   ${YELLOW}npm start${NC}"
echo -e "   (Masukkan nomor WhatsApp bot, lalu masukkan Pairing Code 8-digit di HP Anda)"
echo -e ""
echo -e "2. Jika pairing selesai, jalankan di background 24/7 menggunakan PM2:"
echo -e "   ${YELLOW}npm run pm2:start${NC}"
echo -e "   ${YELLOW}pm2 save && pm2 startup${NC}"
echo -e ""
echo -e "3. Autentikasi Google Antigravity (sekali saja jika belum):"
echo -e "   Ketik: ${YELLOW}agy${NC} lalu ikuti tautan login Google di browser."
echo -e "======================================================\n"
