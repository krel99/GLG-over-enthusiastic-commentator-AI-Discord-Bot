// bun services/retrieveFromVectorDb.ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import color from "colors";
color.enable();

// setting up essentials

const OPEN_AI_KEY = process.env.OPENAI;
const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_PROJECT_API = process.env.SUPABASE_PROJECT_API;

if (!OPEN_AI_KEY || !SUPABASE_PROJECT_URL || !SUPABASE_PROJECT_API) {
  throw new Error("An environment variable is missing!");
}

const model = new OpenAIEmbeddings({ openAIApiKey: OPEN_AI_KEY, batchSize: 2000, stripNewLines: true, maxRetries: 3 });
const client = createClient(SUPABASE_PROJECT_URL, SUPABASE_PROJECT_API);
const vectorStore = new SupabaseVectorStore(model, {
  client,
  tableName: "documents",
  queryName: "match_documents",
});

// handling query and returning data!
export default async (query: string): Promise<any> => {
  const vectorsQuestion = await model.embedQuery(query);
  const retrieved = await vectorStore.similaritySearchVectorWithScore(vectorsQuestion, 1);
  console.log(retrieved);
  return retrieved;
};
