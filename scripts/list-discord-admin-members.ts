#!/usr/bin/env -S npx tsx

import { getBotGuildMembers } from "@/utils/discord-app";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const botToken = process.env.DISCORD_BOT_TOKEN!;
  const guildId = process.env.DISCORD_GUILD_ID!;
  const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID!;

  const members = await getBotGuildMembers(botToken, guildId);
  const admins = members.filter((m) => m.roles.includes(adminRoleId));

  console.log(`users: ${members.length} admins: ${admins.length}`);
  for (const admin of admins) {
    console.log(
      admin.nick || admin.user?.username + "#" + admin.user?.discriminator
    );
  }
}

main();
