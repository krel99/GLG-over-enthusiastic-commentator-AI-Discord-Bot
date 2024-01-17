// bun test textSplitters.test.ts
import { test, expect, describe } from "bun:test";
import path from "path";
import { headersSplitter, cleanHTMLKeepSubheadersAndTables } from "../utilities/textSplitters";
import { Document } from "langchain/document";

const filePath = path.join(process.cwd(), "tests", "helpSectionArticle.html");
const file = Bun.file(filePath);
const stream = await file.text();

describe("Text Splitters - Help Section", () => {
  test("The function should return an array of multiple elements", async () => {
    const output = await headersSplitter(stream);
    expect(output.length).toBeGreaterThan(1);
  });
});
