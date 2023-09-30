#!/usr/bin/env -S npx tsx

import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import { argv } from "process";
dotenv.config({ path: ".env.local" });

async function main() {
  const guildId = argv.slice(2).shift();
  if (!guildId) {
    console.error("run with guildId");
    process.exit(1);
  }

  const botToken = process.env.DISCORD_BOT_TOKEN!;
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  try {
    await client.login(botToken);
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    channels.forEach((c) => {
      if (!c) {
        return;
      }
      console.log(`${c.id}, ${c.name}`);
    });
  } finally {
    client.destroy();
  }
}

main();
