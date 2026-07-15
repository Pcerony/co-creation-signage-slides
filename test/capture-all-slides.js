const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Start a simple self-contained static server
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, '..', decodeURIComponent(urlPath));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      let ext = path.extname(filePath).toLowerCase();
      let contentType = 'text/html';
      if (ext === '.css') contentType = 'text/css';
      else if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(4173, async () => {
  console.log('Self-contained static server started at http://127.0.0.1:4173');
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 1000 });

    const outputDir = path.join(__dirname, '../output/playwright');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let i = 1; i <= 19; i++) {
      const url = `http://127.0.0.1:4173/ppt/index.html?slide=${i}`;
      console.log(`Navigating to ${url}...`);
      await page.goto(url);
      // Wait for transitions and text animations to settle
      await page.waitForTimeout(1500);
      const screenshotPath = path.join(outputDir, `slide-${i}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`Captured ${screenshotPath}`);
    }

    await browser.close();
    console.log('All slides captured successfully!');
  } catch (error) {
    console.error('Error during slide capture:', error);
  } finally {
    server.close(() => {
      console.log('Server stopped.');
    });
  }
});
