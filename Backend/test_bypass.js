import Puppeteer_Cheerio from './utils/puppeteer_cheerio.js';

async function test() {
  const url = 'https://www.fusz.com/';
  console.log(`Starting test for ${url}...`);
  try {
    const result = await Puppeteer_Cheerio(url);
    console.log('Test complete!');
    console.log('Is Bot Protected:', result.isBotProtected);
    
    if (result.screenshot) {
      import('fs').then(fs => {
        fs.writeFileSync('bypass_screenshot.jpg', result.screenshot, 'base64');
        console.log('Screenshot saved to bypass_screenshot.jpg');
      });
    }

    console.log('Status:', result.response.status());
    console.log('Title:', await result.page.title());
    
    if (result.browser) await result.browser.close();
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
