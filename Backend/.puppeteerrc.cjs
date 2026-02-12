const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Download Chrome during npm install
    skipDownload: false,

    // Cache directory for Chrome (in project directory, persists on Render)
    cacheDirectory: join(__dirname, 'chrome-cache'),
};
