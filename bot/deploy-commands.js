import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  // Placebet command
  new SlashCommandBuilder()
    .setName("placebet")
    .setDescription("Place a bet on a Polymarket market")
    .addStringOption(option =>
      option
        .setName("marketid")
        .setDescription("The market ID you want to bet on")
        .setRequired(true)
    ),

  // Cashout command
  new SlashCommandBuilder()
    .setName("cashout")
    .setDescription("Cash out your positions"),
].map(cmd => cmd.toJSON());


const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

