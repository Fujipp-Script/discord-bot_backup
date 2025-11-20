import { ChannelType } from "discord.js";

export interface RoleBackup {
  name: string;
  color: number | null;
  hoist: boolean;
  mentionable: boolean;
  permissions: string[];   // e.g. ["ViewChannel","SendMessages"]
  isEveryone: boolean;     // true = @everyone
  position: number;        // ใช้ช่วยเรียง
}

export type OverwriteTargetType = "role" | "member";

export interface OverwriteBackup {
  type: OverwriteTargetType;
  targetId?: string;       // เผื่อกรณีกู้บนกิลด์เดิม
  targetName?: string;     // สำหรับแมป role ด้วยชื่อ
  allow: string[];
  deny: string[];
}

export interface ChannelBackup {
  name: string;
  type: keyof typeof ChannelType;    // "GuildText" | "GuildVoice" | "GuildCategory" | ...
  parent?: string;                   // ชื่อหมวดหมู่
  topic?: string | null;
  nsfw?: boolean;
  rateLimitPerUser?: number | null;
  bitrate?: number | null;
  userLimit?: number | null;
  position?: number;
  permissionOverwrites: OverwriteBackup[];
}

export interface BackupSchema {
  version: 1;
  guild: { id: string; name: string };
  roles: RoleBackup[];
  channels: ChannelBackup[];         // รวม category ด้วย (type=GuildCategory)
}
