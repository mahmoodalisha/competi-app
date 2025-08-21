const { Wallet } = require("ethers");
const fs = require("fs");


const wallet = Wallet.createRandom();

console.log("===== NEW WALLET =====");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);


const envContent = `PRIVATE_KEY=${wallet.privateKey}\nWALLET_ADDRESS=${wallet.address}\n`;
fs.writeFileSync(".env", envContent, { flag: "a" }); 

console.log("\nSaved PRIVATE_KEY and WALLET_ADDRESS to .env file.");
