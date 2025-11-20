import {
  ChannelType,
  Guild,
  OverwriteType,
  PermissionResolvable,
} from "discord.js";
import { BackupSchema } from "../types.js";

export async function importGuild(guild: Guild, data: BackupSchema) {
  // --- 1) Roles ---
  const everyone = data.roles.find(r => r.isEveryone);
  const others = data.roles.filter(r => !r.isEveryone);

  if (everyone) {
    await guild.roles.everyone.setPermissions(everyone.permissions as PermissionResolvable);
  }

  // สร้าง role อื่น ๆ ตามลำดับ (อาจไม่เป๊ะเรื่องตำแหน่ง แต่ใกล้เคียง)
  const roleMap = new Map<string, string>(); // name -> id
  for (const r of others) {
    const created = await guild.roles.create({
      name: r.name,
      color: r.color ?? undefined,
      hoist: r.hoist,
      mentionable: r.mentionable,
      permissions: r.permissions as PermissionResolvable
    });
    roleMap.set(r.name, created.id);
  }

  // --- 2) Categories ---
  const categories = data.channels
    .filter(c => c.type === "GuildCategory")
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const categoryIdMap = new Map<string, string>(); // name -> id
  for (const cat of categories) {
    const created = await guild.channels.create({
      name: cat.name,
      type: ChannelType.GuildCategory,
      position: cat.position ?? undefined
    } as any);
    categoryIdMap.set(cat.name, created.id);
  }

  // --- 3) Channels (non-category) ---
  const normalChannels = data.channels
    .filter(c => c.type !== "GuildCategory")
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  for (const ch of normalChannels) {
    const typeVal = ChannelType[ch.type];
    const parentId = ch.parent ? categoryIdMap.get(ch.parent) : undefined;

    // map overwrites
    const overwrites = (ch.permissionOverwrites || [])
    .map(ow => {
      let targetId = ow.targetId;
      if (ow.type === "role") {
        if (ow.targetName && roleMap.has(ow.targetName)) {
          targetId = roleMap.get(ow.targetName)!;
        }
        if (!targetId && ow.targetName === "@everyone") {
          targetId = guild.roles.everyone.id;
        }
      }
      if (!targetId) return null;

      const typeEnum: OverwriteType = ow.type === "role"
        ? OverwriteType.Role
        : OverwriteType.Member;

      return {
        id: targetId,
        type: typeEnum,
        allow: ow.allow as PermissionResolvable, // string[] OK
        deny: ow.deny as PermissionResolvable,   // string[] OK
      };
    })
    .filter(Boolean) as any[];

  const opts: any = {
    name: ch.name,
    type: typeVal,
    parent: parentId,
    position: ch.position ?? undefined,
    permissionOverwrites: overwrites
  };

  if (typeVal === ChannelType.GuildText || typeVal === ChannelType.GuildAnnouncement) {
    opts.topic = ch.topic ?? undefined;
    opts.nsfw = ch.nsfw ?? undefined;
    opts.rateLimitPerUser = ch.rateLimitPerUser ?? undefined;
  }
  if (typeVal === ChannelType.GuildForum) {
    opts.nsfw = ch.nsfw ?? undefined;
    opts.topic = ch.topic ?? undefined;
  }
  if (typeVal === ChannelType.GuildVoice || typeVal === ChannelType.GuildStageVoice) {
    opts.bitrate = ch.bitrate ?? undefined;
    opts.userLimit = ch.userLimit ?? undefined;
  }

  await guild.channels.create(opts);
}
}
