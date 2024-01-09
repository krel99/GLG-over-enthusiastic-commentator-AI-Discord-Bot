// bun scrapeSave.ts
// this app will scrape the GLG help page and save the articles to a database
// ! postgress server needs to be running for this to work
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath, Browser } from "puppeteer";
import colors from "colors";
colors.enable();

import { createTable, insertData } from "./postgresDatabaseUtilities";

puppeteer.use(StealthPlugin());

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch({ headless: false, executablePath: executablePath() });

  await createTable("GLG_Help_Articles");

  // Find a page, then wait till it loads
  const page = await browser.newPage();
  // await page.goto(""); // ! -- link removed
  const element = await page.waitForSelector(".promoted-articles-item");

  if (!element) {
    throw new Error("Element not found");
  }

  // Get link to every article on the Help page
  const promotedLinksOfSetsOfArticles: string[] = await page.$$eval("li.promoted-articles-item a", (links) =>
    links.map((link) => link.href)
  );
  let promotedArticlesURLs: string[] = [];

  // Navigate to each article, submit to the database
  for (const link of promotedLinksOfSetsOfArticles) {
    await page.goto(link);
    await page.waitForSelector(".article-sidebar .collapsible-sidebar-body a.sidenav-item");
    const articles: string[] = await page.$$eval(".article-sidebar .collapsible-sidebar-body a.sidenav-item", (links) =>
      links.map((link) => link.href)
    );

    // Use push.apply to concatenate the arrays
    Array.prototype.push.apply(promotedArticlesURLs, articles);
  }

  console.log(promotedArticlesURLs);

  for (const articleURL of promotedArticlesURLs) {
    await page.goto(articleURL);
    await page.waitForSelector(".article-info");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const article_title = await page.$eval("h1.article-title", (element) => element.textContent.trim());
    const article_body = await page.$$eval(".article-body", (elements) =>
      elements.map((element) => element.textContent.trim()).join(" ")
    );
    await insertData("GLG_Help_Articles", articleURL, article_title, article_body);
    console.log(article_title.yellow);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log(article_body.magenta);
  }

  // Dispose of handle
  await element.dispose();

  // Close browser after 10 seconds
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await browser.close();
  console.log("Browser closed".green);
})();
