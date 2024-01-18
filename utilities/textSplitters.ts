// bun run utilities/textSplitters.ts

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";

// ! UNTESTED
function cleanHTMLKeepSubheadersAndTables(inputString: string) {
  // Remove all HTML tags except subheaders and table-related tags; Remove attributes
  // TODO can be combined into one or two regexes only
  inputString = inputString.replace(/<(h[1-6]|table|tr|td|th).*?>/gi, "<$1>");
  inputString = inputString.replace(/<(?!\/?(h[1-6]|table|tr|td|th)\b).*?>/gs, "");
  inputString = inputString.replace(/<(table|tr|td|th)\s+[^>]*>/gi, "<$1>");

  return inputString;
}

async function headersSplitter(text: string, chunkSize: number, chunkOverlap: number, newMetadata?: object): Promise<Document[]> {
  const cleanedText = cleanHTMLKeepSubheadersAndTables(text);
  const splitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
    chunkSize: chunkSize,
    chunkOverlap: chunkOverlap,
    separators: ["<h1>", "<h2>", "<h3>", "<h4>", "<h5>", "<h6>"],
    keepSeparator: true,
  });

  const output = await splitter.createDocuments([cleanedText]);

  for (const doc of output) {
    doc.metadata.metadata = newMetadata;
  }

  // console.log(output[0].metadata);
  return output;
}

export { headersSplitter, cleanHTMLKeepSubheadersAndTables };
