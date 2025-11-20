import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Collection,
  Interaction
} from "discord.js";
import { data as backupData, execute as backupExecute } from "./commands/backup.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = new Collection<string, { data: any; execute: (i: any) => Promise<void> }>();
commands.set(backupData.name, { data: backupData, execute: (i: any) => backupExecute(i) });

client.once("ready", () => {
  console.log(`✅ Ready as ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = commands.get(interaction.commandName);
  if (!cmd) return;
  await cmd.execute(interaction);
});

client.login(process.env.DISCORD_TOKEN);
