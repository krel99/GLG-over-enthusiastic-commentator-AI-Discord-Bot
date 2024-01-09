// bun bot.ts
import fs from "node:fs";
import path from "node:path";
import { Client, Collection, Emoji, Events, GatewayIntentBits, Message, MessageReaction, User } from "discord.js";
import { ChatOpenAI } from "@langchain/openai";
import templateInvocationWithParse from "./services/templateInvocationWithParse";
declare module "discord.js" {
  interface Client {
    commands: Collection<string, any>;
  }
}

const KITCHEN_KNIFE_EMOJI = "🤖";
const TWO_KITCHEN_KNIFE_EMOJIS = "🔪🔪";

// initiate OpenAI chat model
const OPEN_AI_KEY = process.env.OPENAI;

if (!OPEN_AI_KEY) {
  throw new Error("OPENAI environment variable is not set");
}

const chatModel = new ChatOpenAI({ openAIApiKey: OPEN_AI_KEY });

// create a new Client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
}); // , GatewayIntentBits.MessageContent

// handling slash commands
client.commands = new Collection();

const foldersPath = path.join(process.cwd(), "slashCommands");
const commandFiles = fs.readdirSync(foldersPath).filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

// this will load all the commands in the slashCommands folder and add them onto client object
for (const file of commandFiles) {
  const filePath = path.join(foldersPath, file);
  import(filePath)
    .then((module) => {
      console.log(`Loading command ${module.data.name}`);
      if ("data" in module && "execute" in module) {
        client.commands.set(module.data.name, module);
      } else {
        throw new Error(`Command ${module.data.name} is missing required properties`);
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

// listen for the interactionCreate event, this happens after the slash command is invoked
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`Command ${interaction.commandName} not found`);
  }

  if (interaction.commandName === "ping") {
    try {
      await interaction.deferReply();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await interaction.editReply("Pong!");
    } catch (error) {
      if (!interaction.replied && !interaction.deferred) {
        console.error(error);
        await interaction.reply({ content: "There was an error while executing the ping command!", ephemeral: true });
      }
      return;
    }
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    // Only log error and send response if interaction has not been replied or deferred
    if (!interaction.replied && !interaction.deferred) {
      console.error(error);
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  }
});

/**
 * collect :kitchen-knife: :knife: reactions
 * TODO on:collect invoke runnable sequence
 */
// ! MessageReaction may be invalid type
client.on(Events.MessageCreate, async (message: Message) => {
  const collectorFilter = (reaction: MessageReaction, user: User) => {
    return reaction.emoji.name === KITCHEN_KNIFE_EMOJI;
  };

  const collector = message.createReactionCollector({ filter: collectorFilter, time: 30_000 });

  collector.on("collect", async (reaction, user) => {
    console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
    console.log(message.content);
    try {
      message.channel.send("Thinking...");
      const response = await templateInvocationWithParse(chatModel, message.content);
      if (typeof response === "undefined") {
        await message.channel.send("I don't know what to say");
        throw new Error("Response is undefined");
      }
      await message.channel.send(response);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  });

  collector.on("end", (collected) => {
    console.log(`Collected ${collected.size} items`);
  });
});

// listen for the client to be ready
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// login with the token from .env.local
if (!process.env.DISCORD_TOKEN) {
  throw new Error("[ERROR] One of the tokens is missing, check your .env.local");
}
client.login(process.env.DISCORD_TOKEN);
