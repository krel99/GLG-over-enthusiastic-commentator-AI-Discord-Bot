//  copied from https://github.com/rgl/try-puppeteer-in-bun

export function cleanHTMLKeepSubheadersAndTables(inputString) {
  // Remove all HTML tags except subheaders and table-related tags
  inputString = inputString.replace(/<(?!\/?(h[1-6]|table|tr|td|th)\b)[^>]*>/gi, "");

  // Remove attributes from table-related tags
  inputString = inputString.replace(/<(table|tr|td|th)\b[^>]*>/gi, (match) => {
    return `<${match.match(/(table|tr|td|th)/i)[0]}>`;
  });

  return inputString;
}

export async function browserInstall() {
  let downloaded = false;
  const chromeVersion = PUPPETEER_REVISIONS.chrome;
  return await browsers.install({
    browser: "chrome",
    buildId: chromeVersion,
    cacheDir: `${os.homedir()}/.cache/puppeteer`,
    downloadProgressCallback: (downloadedBytes, totalBytes) => {
      if (!downloaded) {
        downloaded = true;
        log(`Downloading the browser Chrome/${chromeVersion}...`);
      }
    },
  });
}
