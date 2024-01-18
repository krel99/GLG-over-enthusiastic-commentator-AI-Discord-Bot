// bun bot.ts
import fs from "node:fs";
import path from "node:path";
import { Client, Collection, Events, GatewayIntentBits, Message, MessageReaction, User } from "discord.js";
import { ChatOpenAI } from "@langchain/openai";
import templateInvocationWithParse from "./messages/templateInvocationWithParse";
import color from "colors";
import { createFeedbackTable, insertFeedbackData } from "./services/localPostgresDb/postgresFunctions";
color.enable();
declare module "discord.js" {
  interface Client {
    commands: Collection<string, any>;
  }
}

const KITCHEN_KNIFE_EMOJI = "🤖";
const TWO_KITCHEN_KNIFE_EMOJIS = "🔪🔪";

const RATING_STABBING = "🔪";
const RATING_SHARP = "🗡️";
const RATING_OK = "🪓";
const RATING_NOT_SHARP = "🖊️";
const RATING_DULL = "🪑";
// create feedback table if it doesn't exist
createFeedbackTable("Feedback");

// initiate OpenAI chat model
const OPEN_AI_KEY = process.env.OPENAI;

if (!OPEN_AI_KEY) {
  throw new Error("OPENAI environment variable is not set");
}

const chatModel = new ChatOpenAI({ openAIApiKey: OPEN_AI_KEY, temperature: 0.3, modelName: "gpt-4-0613" });

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

// listen for requests for automated answer
client.on(Events.MessageCreate, async (message: Message) => {
  const collectorFilter = (reaction: MessageReaction, user: User) => {
    return reaction.emoji.name === KITCHEN_KNIFE_EMOJI;
  };

  const collector = message.createReactionCollector({ filter: collectorFilter, time: 240_000 });

  collector.once("collect", async (reaction, user) => {
    console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);

    try {
      // create and send automated answer
      let { answer, fullContext } = await templateInvocationWithParse(chatModel, message.content);
      if (typeof answer === "undefined") {
        await message.channel.send("I don't know what to say");
        throw new Error("Response is undefined");
      }
      answer =
        answer +
        "\n\n" +
        `Please rate my response from totally stabbing to pretty dull: ${RATING_STABBING}${RATING_SHARP}${RATING_OK}${RATING_NOT_SHARP}${RATING_DULL}`;
      const responseMessage = await message.channel.send(answer);

      // listen for the feedback on the automated answer from the user who asked
      const collectorFilter = (reaction: MessageReaction, user: User) => {
        const isRatingEmoji =
          reaction.emoji.name === RATING_STABBING ||
          reaction.emoji.name === RATING_SHARP ||
          reaction.emoji.name === RATING_OK ||
          reaction.emoji.name === RATING_NOT_SHARP ||
          reaction.emoji.name === RATING_DULL;
        const isUserWhoAsked = user.id === message.author.id;
        return isRatingEmoji && isUserWhoAsked;
      };
      const responseCollector = responseMessage.createReactionCollector({ filter: collectorFilter, time: 240_000 });
      responseCollector.once("collect", (reaction, user) => {
        // TODO write the feedback to the database

        console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
        if (!reaction.emoji.name) return;
        insertFeedbackData("Feedback", message.content, fullContext, responseMessage.content.split("\n")[0], reaction.emoji.name);

        // console.log(`${message.content}`.blue);
        // console.log(`${responseMessage.content.split("\n")[0]}`.green);
        // console.log(`${fullContext}`.red)
      });
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
