//  copied from https://github.com/rgl/try-puppeteer-in-bun

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
