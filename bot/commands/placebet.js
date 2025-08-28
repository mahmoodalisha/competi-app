import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function getWalletForDiscord(discordId) {
  console.log("🔎 ENV WALLET_ADDRESS:", process.env.WALLET_ADDRESS);
  return process.env.WALLET_ADDRESS;
}


export default {
  data: {
    name: "placebet",
    description: "Place a bet on a Polymarket market",
    options: [
      {
        name: "marketid",
        type: 3,
        description: "The ID of the market",
        required: true,
      },
    ],
  },

  async execute(interaction) {
    try {
      const marketId = interaction.options.getString("marketid");
      const discordId = interaction.user.id;

      console.log("✅ Discord ID:", discordId);

      
      await interaction.deferReply({ ephemeral: true });

      const wallet = await getWalletForDiscord(discordId);
      console.log("✅ Wallet:", wallet);

      
      const res = await fetch("http://localhost:3000/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordUserId: discordId, wallet, marketId, type: "placebet" }),
      });

      const data = await res.json();
      console.log("Session response:", data);

      if (data.error) {
        return interaction.editReply(`❌ Failed to create session: ${data.error}`);
      }

      // Construct popup URL
      const popupUrl = data.url; // already built in API
      await interaction.editReply(`✅ Session created!\nClick here: ${popupUrl}`);
    } catch (err) {
      console.error("🔥 Error in placebet.js:", err);
      // use editReply instead of reply since i have already deferred
      await interaction.editReply("❌ Error executing command, check console logs.");
    }
  },
};