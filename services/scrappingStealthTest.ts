// bun utility/isThisBot.ts
// https://bot.sannysoft.com/

// Use import statements instead of require
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser } from "puppeteer";
import path from "path";

// Apply stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

// You can destructure executablePath directly from the puppeteer import if it's exported, or specify the exact method if needed.
import { executablePath } from "puppeteer";

const url = "https://bot.sannysoft.com/";

const main = async (): Promise<void> => {
  const browser = await puppeteer.launch({ headless: false, executablePath: executablePath() });
  const page = await browser.newPage();
  await page.goto(url);
  await page.screenshot({ path: path.join(process.cwd(), "utility", "bot.jpg") });
  // await browser.close();
};

main();
