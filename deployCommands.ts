// bun deployCommands.ts
import { REST } from "discord.js";
import { Routes } from "discord-api-types/v9";
import fs from "fs";
import path from "path";

import { ApplicationCommandData } from "discord.js";

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
const clientId = process.env.CLIENT_ID;

// TODO asynchronous readdir instead of readdirSync

if (!token || !clientId || !guildId) {
  throw new Error("[ERROR] One of the tokens is missing, check your .env.local");
}

const commands: ApplicationCommandData[] = [];

const foldersPath = path.join(process.cwd(), "slashCommands");

// This could be done synchronously, for better performance, but dependencies would need to be awaited
const commandFiles = fs.readdirSync(foldersPath).filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

const importPromises: Promise<any>[] = [];

// Load all the commands in the slashCommands folder and add them onto the commands array
for (const file of commandFiles) {
  const filePath = path.join(foldersPath, file);
  const importPromise = import(filePath)
    .then((module) => {
      console.log(`Loading command ${module.data.name}`);
      if (module.data && "execute" in module) {
        const commandData = module.data.toJSON();
        commands.push(commandData);
        console.log(`${module.data.name} was pushed to the commands array`);
      } else {
        throw new Error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    })
    .catch((err) => {
      console.error(err);
    });

  importPromises.push(importPromise);
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Wait for all the import promises to resolve
Promise.all(importPromises).then(() => {
  (async () => {
    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);
      const data: any = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error(error);
    }
  })();
});
