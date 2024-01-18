// bun services/vectorDb/saveToVectorDb.ts
//
// this shows how to prepare database on Supabase's side: https://js.langchain.com/docs/integrations/vectorstores/supabase/
//
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { retrieveAllRows } from "../localPostgresDb/postgresFunctions";
import color from "colors";
import { Document } from "langchain/document";
import { headersSplitter } from "../../utilities/textSplitters";
import { QueryResult } from "pg";
color.enable();

type DocumentWithVector = {
  document: Document;
  vector: number[];
};

const OPEN_AI_KEY = process.env.OPENAI;
const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_PROJECT_API = process.env.SUPABASE_PROJECT_API;

if (!OPEN_AI_KEY || !SUPABASE_PROJECT_URL || !SUPABASE_PROJECT_API) {
  throw new Error("An environment variable is missing!");
}

const model = new OpenAIEmbeddings({ openAIApiKey: OPEN_AI_KEY, batchSize: 512, stripNewLines: true, maxRetries: 3 });
const client = createClient(SUPABASE_PROJECT_URL, SUPABASE_PROJECT_API);

async function processRows() {
  const data: QueryResult | undefined = await retrieveAllRows("GLG_Help_Articles");

  if (!data) {
    throw new Error("No data retrieved from the database!");
  }

  // Must use promises, so I can wait for all of them to resolve, before returning
  const documentVectorPairs: Promise<DocumentWithVector>[] = data.rows.map(async (row) => {
    const document: Document = {
      pageContent: row.article_body,
      metadata: { title: row.article_title, url: row.article_url, scraped_date: row.scraped_date },
    };
    const vector = await model.embedQuery(row.article_body);

    return { document, vector };
  });
  return Promise.all(documentVectorPairs);
}

const documentVectorPairs = await processRows();
console.log(`[Success]`.green + ` Embedding-Vector pairs created. Saving them to Supabase...`);

// save embeddings to Supabase
const vectorStore = new SupabaseVectorStore(model, {
  client,
  tableName: "documents",
});

let documents: Document[] = [];
let vectors: number[][] = [];

documentVectorPairs.forEach((pair) => {
  documents.push(pair.document);
  vectors.push(pair.vector);
});

try {
  await vectorStore.addVectors(vectors, documents);
} catch (err) {
  console.error(err);
}

console.log(`[Success]`.yellow + ` Embeddings saved to Supabase. `);
