import {
  ChannelType,
  Guild,
} from "discord.js";
import { BackupSchema, ChannelBackup, RoleBackup } from "../types.js";

export async function exportGuild(guild: Guild): Promise<BackupSchema> {
  await guild.roles.fetch();
  await guild.channels.fetch();

  // ---- Roles ----
  const roles: RoleBackup[] = guild.roles.cache
    .sort((a, b) => a.position - b.position)
    .map(r => ({
      name: r.name,
      color: r.color || null,
      hoist: r.hoist,
      mentionable: r.mentionable,
      permissions: r.permissions.toArray(), // string[]
      isEveryone: r.id === guild.id,
      position: r.position
    }));

  // ---- Channels (skip threads) ----
  const channels: ChannelBackup[] = guild.channels.cache
    .filter(ch => !("isThread" in ch && typeof (ch as any).isThread === "function" && (ch as any).isThread()))
    .sort((a, b) => ((("position" in a) ? (a as any).position : 0) - (("position" in b) ? (b as any).position : 0)))
    .map(ch => {
      // overwrites
      const overwrites = ("permissionOverwrites" in ch)
        ? (ch as any).permissionOverwrites.cache.map((ow: any) => ({
            type: ow.type as "role" | "member",
            targetId: ow.id as string,
            targetName: ow.type === "role" ? guild.roles.cache.get(ow.id)?.name : undefined,
            allow: ow.allow.toArray() as string[],
            deny: ow.deny.toArray() as string[],
          }))
        : [];

      const base: ChannelBackup = {
        name: ch.name,
        type: ChannelType[ch.type] as keyof typeof ChannelType,
        parent: (ch as any).parent?.name,
        position: (("position" in ch) ? (ch as any).position : 0),
        permissionOverwrites: overwrites,
      };

      const anyCh = ch as any;

      // text-like
      if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement) {
        base.topic = anyCh.topic ?? null;
        base.nsfw = Boolean(anyCh.nsfw);
        base.rateLimitPerUser = anyCh.rateLimitPerUser ?? null;
      }

      // forum
      if (ch.type === ChannelType.GuildForum) {
        base.nsfw = Boolean(anyCh.nsfw);
        base.topic = anyCh.topic ?? null; // บางกิลด์ไม่ได้ตั้ง
      }

      // voice-like
      if (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice) {
        base.bitrate = anyCh.bitrate ?? null;
        base.userLimit = anyCh.userLimit ?? null;
      }

      return base;
    });

  return {
    version: 1,
    guild: { id: guild.id, name: guild.name },
    roles,
    channels
  };
}
