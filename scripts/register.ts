import "dotenv/config";
import { REST, Routes } from "discord.js";
import { data as backupData } from "../src/commands/backup.js";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

async function main() {
  const body = [backupData.toJSON()];
  await rest.put(
    Routes.applicationGuildCommands(process.env.APP_ID!, process.env.GUILD_ID!),
    { body }
  );
  console.log("✅ Registered guild commands");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
