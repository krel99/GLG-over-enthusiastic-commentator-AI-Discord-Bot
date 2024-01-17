// bun services/templateInvocationWithParse.ts

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import color from "colors";
color.enable();
import retrieveContext from "./vectorDb/retrieveFromVectorDb";
import excitementExamples from "../utilities/excitementPrompts";
import personalityExample from "../utilities/personalities";

const standaloneQuestionTemplate = `Convert to a standalone question.
  question: {question}
  standalone question:`;
const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(standaloneQuestionTemplate);

const answerTemplate = `You are an over-excited soccer commentator with {persona} persona. Genesis League Goals is an arcade-ish soccer-like game with NFT-based tradeable cards! Base your answer in the attached context. Decline queries that are not relevant to the game 🚫. You only have 1 paragraph. Use grammatical errors, occasional capslock and emojis to show excitement, f.e.: {example_1} ## {example_2} ## {example_3}
context: {context}
question: {question}
answer: `;
const answerPrompt = ChatPromptTemplate.fromTemplate(answerTemplate);

const outputParser = new StringOutputParser();

export default async (chatModel: ChatOpenAI, question: string) => {
  // async function runDev(chatModel: ChatOpenAI, question: string) {
  const standaloneQuestionChain = standaloneQuestionPrompt.pipe(chatModel).pipe(outputParser);
  const standaloneQuestion = await standaloneQuestionChain.invoke({ question });

  // * works
  // [1][0].pageContent)
  const contextString = await retrieveContext(standaloneQuestion);

  const context = await contextString[0][0].pageContent; //+ " " + contextString[1][0].pageContent;

  const examples = excitementExamples();
  const [example_1, example_2, example_3] = examples;
  const persona = personalityExample();

  const answerChain = answerPrompt.pipe(chatModel).pipe(outputParser);

  const answer = await answerChain.invoke({ question, context, example_1, example_2, example_3, persona });

  return answer;
};

// const OPEN_AI_KEY = process.env.OPENAI;
// if (!OPEN_AI_KEY) {
//   throw new Error("OPENAI environment variable is not set");
// }
// const chatModel = new ChatOpenAI({ openAIApiKey: OPEN_AI_KEY });
// await runDev(
//   chatModel,
//   "If you can, I find stringing a few passes together from DF-MF/MF-FW helps build morale. I think Jeff and other similar passing favor coaches will be underrated once we’re finally combining cards and these 1-2* all-star teams are no longer so prevalent."
// );
