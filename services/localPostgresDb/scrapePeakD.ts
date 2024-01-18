// bun services/localPostgresDb/scrapePeakD.ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath, Browser } from "puppeteer";
import colors from "colors";
colors.enable();

import { createTable, insertData } from "./postgresFunctions";
import { headersSplitter } from "../../utilities/textSplitters";

puppeteer.use(StealthPlugin());

const preSelectedURLs: string[] = [
  "https://peakd.com/gls/@gls.goals/genesis-league-goals-or-ranked-system-ranked-rewards-and-daily-pass",
  "https://peakd.com/genesisleaguesports/@gls.goals/genesis-league-goals-card-leveling-and-combining-version-11",
];

(async () => {
  // async function scrapePeakD() {
  //Prepare the environment
  const browser = await puppeteer.launch({ headless: "new", executablePath: executablePath() });
  await createTable("GLG_Help_Articles");
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
          if (child.classList.contains("table-responsive")) {
            textBody += child.outerHTML + "\n";
            continue;
          }
          textBody += child.textContent.trim() + "\n";
        }
        return textBody;
      });

      const articleChunks = await headersSplitter(articleBody, 1600, 300);

      for (const chunk of articleChunks) {
        await insertData("GLG_Help_Articles", articleURL, articleTitle, chunk.pageContent);
        console.log(chunk.pageContent);
      }
    } catch (error: any) {
      console.error(`Error fetching ${articleURL}: ${error.message}`);
    }
  }
  await browser.close();
  // }
})();
