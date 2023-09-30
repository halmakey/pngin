#!/usr/bin/env -S npx tsx

import { getBotGuildRoles } from "@/utils/discord-app";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const botToken = process.env.DISCORD_BOT_TOKEN!;
  const guildId = process.env.DISCORD_GUILD_ID!;

  const roles = await getBotGuildRoles(botToken, guildId);
  for (const role of roles) {
    console.log(`id: ${role.id} name: ${role.name}`);
  }
}

main();
