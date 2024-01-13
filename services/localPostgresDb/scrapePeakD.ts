// bun services/localPostgresDb/scrapePeakD.ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath, Browser } from "puppeteer";
import colors from "colors";
colors.enable();

import { createTable, insertData } from "./postgresFunctions";
import { Element, Node } from "cheerio";

puppeteer.use(StealthPlugin());

const preSelectedURLs: string[] = [
  "https://peakd.com/gls/@gls.goals/genesis-league-goals-or-ranked-system-ranked-rewards-and-daily-pass",
  "https://peakd.com/genesisleaguesports/@gls.goals/genesis-league-goals-card-leveling-and-combining-version-11",
];

(async () => {
  //Prepare the environment
  const browser = await puppeteer.launch({ headless: "new", executablePath: executablePath() });
  //   await createTable("GLG_Help_Articles");
  const page = await browser.newPage();

  // Traverse URLs
  for (const articleURL of preSelectedURLs) {
    try {
      await page.goto(articleURL);
      await page.waitForSelector("h1");
      await page.waitForSelector("div#post-body-container");
      const articleTitle = await page.$eval("h1", (element) => element.textContent.trim());
      const articleBody = await page.$eval("div#post-body-container div div", (element) => {
        let textBody = ""; //element.outerHTML;
        for (const child of element.children) {
          if (child.tagName == "HR") break;
          // ! This is horrible handling of tables, create handleTable function
          if (child.classList.contains("table-responsive")) {
            textBody += child.outerHTML + "\n";
            continue;
          }
          textBody += child.textContent.trim() + "\n";
        }
        return textBody;
      });
      await insertData("GLG_Help_Articles", articleURL, articleTitle, articleBody);
    } catch (error: any) {
      console.error(`Error fetching ${articleURL}: ${error.message}`);
    }
  }
  await browser.close();
})();

// fetchAndParseURLs(preSelectedURLs);
