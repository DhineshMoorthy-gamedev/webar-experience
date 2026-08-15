import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const consoleLogs = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => pageErrors.push(err.message));
    page.on('requestfailed', req => failedRequests.push(`${req.url()} (${req.failure()?.errorText})`));

    const response = await page.goto('https://dhineshmoorthy-gamedev.github.io/webar-experience/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const status = response.status();
    const title = await page.title();
    const content = await page.evaluate(() => {
      const btn = document.getElementById('start-btn');
      return {
        title: document.title,
        buttonText: btn ? btn.textContent : null,
        bodyHtmlSnippet: document.body.innerHTML.substring(0, 300)
      };
    });

    console.log('HTTP Status:', status);
    console.log('Page Title:', title);
    console.log('DOM Content:', JSON.stringify(content, null, 2));
    console.log('Console Logs:', consoleLogs);
    console.log('Page Errors:', pageErrors);
    console.log('Failed Requests:', failedRequests);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
