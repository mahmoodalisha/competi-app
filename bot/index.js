import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import { join } from "path";
import { readdir } from "fs/promises";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();


async function loadCommands() {
  const commandsPath = join(process.cwd(), "commands");
  const files = await readdir(commandsPath);

  for (const file of files.filter(f => f.endsWith(".js"))) {
    const command = await import(`file://${join(commandsPath, file)}`);
    if (command.default?.data && command.default?.execute) {
      client.commands.set(command.default.data.name, command.default);
      console.log(`✅ Loaded ${command.default.data.name}`);
    }
  }
}

client.once("ready", () => {
  console.log(`🚀 Bot logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: "❌ Error executing command", ephemeral: true });
  }
});

async function start() {
  await loadCommands();
  await client.login(process.env.DISCORD_TOKEN);
}

start();
