// bun run utilities/textSplitters.ts

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";

// ! UNTESTED
export function cleanHTMLKeepSubheadersAndTables(inputString: string) {
  // Remove all HTML tags except subheaders and table-related tags
  inputString = inputString.replace(/<(?!\/?(h[1-6]|table|tr|td|th)\b)[^>]*>/gi, "");

  // Remove attributes from table-related tags
  inputString = inputString.replace(/<(table|tr|td|th)\s+[^>]*>/gi, "<$1>");

  return inputString;
}

async function headersSplitter(text: string): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 80,
    chunkOverlap: 10,
    separators: ["<h1>", "<h2>", "<h3>", "<h4>", "<h5>", "<h6>"],
    keepSeparator: false,
  });

  const output = await splitter.createDocuments([text]);
  //   console.log(output);
  return output;
}

export { headersSplitter };
