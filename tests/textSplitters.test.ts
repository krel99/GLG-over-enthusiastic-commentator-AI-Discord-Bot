// bun test textSplitters.test.ts
import { test, expect, describe } from "bun:test";
import path from "path";
import { headersSplitter, cleanHTMLKeepSubheadersAndTables } from "../utilities/textSplitters";
import { Document } from "langchain/document";

const htmlPath = path.join(process.cwd(), "tests", "testRichHtml.html");
const htmlFile = Bun.file(htmlPath);
const htmlStream = await htmlFile.text();

const subheadersPath = path.join(process.cwd(), "tests", "testManySubheaders.html");
const subheadersFile = Bun.file(subheadersPath);
const subheadersStream = await subheadersFile.text();

describe("Text Splitters - Help Section", () => {
  test("The function should return an array of multiple elements", async () => {
    const output = await headersSplitter(htmlStream, 120, 15);
    expect(output.length).toBeGreaterThan(1);
  });

  test("each output document's pageContent length should be lower than or equal to chunkSize", async () => {
    const htmlInput = htmlStream;
    const chunkSize = 500;
    const chunkOverlap = 100;
    const tolerance = 50;
    const documents = await headersSplitter(htmlInput, chunkSize, chunkOverlap);
    documents.forEach((documentString) => {
      const length = documentString.pageContent.length;
      expect(length).toBeGreaterThanOrEqual(chunkOverlap + 1);
      expect(length).toBeLessThanOrEqual(chunkSize);
    });
  });

  test("should keep headers intact if there are any, headers must not be split!", async () => {
    const htmlInput = subheadersStream;
    const chunkSize = 500;
    const chunkOverlap = 100;
    const documents = await headersSplitter(htmlInput, chunkSize, chunkOverlap);
    documents.forEach((documentString) => {
      const openingTags = documentString.pageContent.match(/<h\d>/g) || [];
      const closingTags = documentString.pageContent.match(/<\/h\d>/g) || [];
      openingTags.forEach((tag, index) => {
        expect(documentString.pageContent).toContain(tag);
        if (closingTags[index]) {
          expect(documentString.pageContent).toContain(closingTags[index]);
        }
      });
    });
  });

  test("should handle input string with no subheaders or table-related tags when the function is called", async () => {
    const text = "<p>Paragraph 1</p><p>Paragraph 2</p>";
    const chunkSize = 10;
    const chunkOverlap = 5;
    const output = await headersSplitter(text, chunkSize, chunkOverlap);
    expect(output.length).toBeGreaterThan(1);
  });
});

describe("Removal of HTML tags", () => {
  test("The function removes HTML tags except subheaders and table-related tags", () => {
    const inputString = '<div class="abcd"><h1>Title</h1><p>Paragraph</p><table><tr><td>Data</td></tr></table></div>';
    const expectedOutput = "<h1>Title</h1>Paragraph<table><tr><td>Data</td></tr></table>";

    const result = cleanHTMLKeepSubheadersAndTables(inputString);

    expect(result).toEqual(expectedOutput);
  });

  test("should remove attributes from table-related tags", () => {
    const inputString = '<table class="table"><tr style="background-color: red;"><td>Data</td></tr></table>';
    const expectedOutput = "<table><tr><td>Data</td></tr></table>";

    const result = cleanHTMLKeepSubheadersAndTables(inputString);

    expect(result).toEqual(expectedOutput);
  });

  test("should handle input with no HTML tags", () => {
    const inputString = "";

    const result = cleanHTMLKeepSubheadersAndTables(inputString);

    expect(result).toEqual(inputString);
  });

  test("should remove all HTML tags except subheaders and table-related tags when input contains self-closing tags", () => {
    const inputString = "<Table /><h1>Title</h1><p>Paragraph</p><table><tr><td>Data</td></tr></table>";
    const expectedOutput = "<h1>Title</h1>Paragraph<table><tr><td>Data</td></tr></table>";

    const result = cleanHTMLKeepSubheadersAndTables(inputString);

    expect(result).toEqual(expectedOutput);
  });
});
