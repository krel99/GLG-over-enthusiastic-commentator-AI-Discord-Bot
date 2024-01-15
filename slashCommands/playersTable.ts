// bun deployCommands.ts
// bun bot.ts
import { SlashCommandBuilder } from "@discordjs/builders";
import { AttachmentBuilder, CommandInteraction } from "discord.js";
import fs from "fs";
import path from "path";
import color from "colors";
color.enable();

import returnPlayersCsv from "../services/playersTable";

export const data = new SlashCommandBuilder()
  .setName("playerlist")
  .setDescription("Provides Google Tables/Excel compatible playerlist incl. all API data")
  .addStringOption((option) => option.setName("hive").setDescription("For example: greenmask9").setRequired(true));

export async function execute(interaction: CommandInteraction) {
  const hiveName = interaction.options.get("hive")?.value as string;

  await interaction.deferReply();

  try {
    const file = await returnPlayersCsv(hiveName);
  } catch (err) {
    await interaction.editReply("API fetch failed (Is GLG server 'orking?)");
    console.log(err);
    return;
  }

  const filePath = path.join(process.cwd(), "playerLists", hiveName, `${hiveName}Cards.csv`);

  const buffer = await fs.promises.readFile(filePath);

  const attachment = new AttachmentBuilder(buffer, {
    name: `${hiveName}Cards.csv`,
    description: "List of players, open in LibreOffice, Excel or Google Tables",
  });

  await interaction.editReply({ content: "Open in LibreOffice, Excel or Google Tables.", files: [attachment] });
}
