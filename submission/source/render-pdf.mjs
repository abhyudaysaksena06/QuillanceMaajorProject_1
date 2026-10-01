import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(dir, '..', 'LearnSphere_LMS_Documentation.pdf');
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
await page.goto('file://' + path.join(dir, 'documentation.html'));
await page.pdf({
  path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
  margin: { top: '22mm', bottom: '20mm', left: '18mm', right: '18mm' },
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font:7px DejaVu Sans Mono,monospace;color:#7d6d59;padding:0 18mm;display:flex;justify-content:space-between"><span>LEARNSPHERE LMS · ABHYUDAY SAKSENA</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
});
await browser.close();
console.log('wrote', out);
