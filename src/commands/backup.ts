import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder
} from "discord.js";
import { exportGuild } from "../backup/exporter.js";
import { importGuild } from "../backup/importer.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const data = new SlashCommandBuilder()
  .setName("backup")
  .setDescription("สำรอง/กู้คืนโครงสร้างกิลด์ (roles/channels/permissions)")
  .addSubcommand(sc => sc
    .setName("export")
    .setDescription("สำรองเป็นไฟล์ JSON"))
  .addSubcommand(sc => sc
    .setName("import")
    .setDescription("กู้คืนจากไฟล์ JSON")
    .addAttachmentOption(opt => opt
      .setName("file")
      .setDescription("ไฟล์สำรอง .json")
      .setRequired(true)))
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: "ใช้คำสั่งในกิลด์เท่านั้น", ephemeral: true });
    return;
  }
  const guild = await interaction.guild!.fetch();
  const sub = interaction.options.getSubcommand();

  if (sub === "export") {
    await interaction.deferReply({ ephemeral: true });
    const data = await exportGuild(guild);

    // เซฟไฟล์ลงโฟลเดอร์ backups/{guildId}.json (optional)
    const dir = join(process.cwd(), "backups");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(JSON.stringify(data, null, 2), "utf-8");
    const out = join(dir, `${guild.id}.backup.json`);
    await writeFile(out, buf);

    const file = new AttachmentBuilder(buf, { name: `${guild.id}.backup.json` });
    await interaction.editReply({ content: "สำเร็จ ✅ นี่คือไฟล์สำรอง", files: [file] });
    return;
  }

  if (sub === "import") {
    const att = interaction.options.getAttachment("file", true);
    if (!att.name.endsWith(".json")) {
      await interaction.reply({ content: "แนบไฟล์ .json เท่านั้น", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const data = await (await fetch(att.url)).json();
    await importGuild(guild, data);
    await interaction.editReply("กู้คืนเสร็จ ✅ กรุณาตรวจสอบลำดับ/สิทธิ์อีกครั้ง");
    return;
  }
}
