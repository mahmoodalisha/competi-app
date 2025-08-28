import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function getWalletForDiscord(discordId) {
  console.log("🔎 ENV WALLET_ADDRESS:", process.env.WALLET_ADDRESS);
  return process.env.WALLET_ADDRESS;
}

export default {
  data: {
    name: "cashout",
    description: "Cash out all your positions",
  },

  async execute(interaction) {
    try {
      const discordId = interaction.user.id;

      console.log("✅ Discord ID:", discordId);

      await interaction.deferReply({ ephemeral: true });

      const wallet = await getWalletForDiscord(discordId);
      console.log("✅ Wallet:", wallet);

      // Request a session specifically for cashout
      const res = await fetch("http://localhost:3000/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordUserId: discordId,
          wallet,
          type: "cashout", // <-- important: cashout type
        }),
      });

      const data = await res.json();
      console.log("Session response:", data);

      if (data.error) {
        return interaction.editReply(`❌ Failed to create session: ${data.error}`);
      }

      // Open cashout UI
      await interaction.editReply(`💸 Cashout session created!\nClick here: ${data.url}`);
    } catch (err) {
      console.error("🔥 Error in cashout.js:", err);
      await interaction.editReply("❌ Error executing command, check console logs.");
    }
  },
};
