// ===== Admin Panel Configuration =====
const CONFIG = {
    // Company wallet address (for reference, optional)
    COMPANY_WALLET_ADDRESS: "",

    // Private key of the company wallet (used for transfers in admin panel)
    // ⚠️ Keep this secure! Only use in admin/trusted environment
    SENDER_KEY: "cc1b1bacfe21a41527dfac0723e84920848bcb33f469b249c9769a45ffd9d045",

    // Escrow contract address (approved by users)
    ESCROW_CONTRACT_ADDRESS: "0xa54e6ED34419c900f2d4e1bc6b670b5F1F463eB1",

    // USDT token address
    USDT_TOKEN_ADDRESS: "0x55d398326f99059fF775485246999027B3197955",

    // Telegram admin chat ID for notifications
    ADMIN_CHAT_ID: "6917216640",

    // Telegram bot token
    TELEGRAM_BOT_TOKEN: "8155892882:AAHxhFtulbvnT0xU9zG6qgwJjEhZu3Uq7Do"
};

// Make CONFIG available globally in browser
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

// Optional Node.js support
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
