#!/usr/bin/env -S npx tsx

import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const botToken = process.env.DISCORD_BOT_TOKEN!;
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  try {
    await client.login(botToken);
    const guilds = await client.guilds.fetch();
    guilds.forEach((g) => console.log(`${g.id}, ${g.name}`));
  } finally {
    client.destroy();
  }
}

main();
