#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');


const CSV_FILE = process.argv[2] || path.join(__dirname, 'projects.csv');
const BULK_UPLOAD_MEDIA = path.join(__dirname, 'bulk-upload-media');
const LOG_FILE = path.join(__dirname, 'screenshot-capture.log');


const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'mobile' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  desktop: { width: 1920, height: 1080, name: 'desktop' }
};


function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE, logEntry + '\n');
}

function parseCSV(content) {
  const lines = content.split('\n');
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const record = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    records.push(record);
  }

  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function captureScreenshots(url, company) {
  const companyDirName = company.toLowerCase();
  const companyDir = path.join(BULK_UPLOAD_MEDIA, companyDirName);
  const galleryDir = path.join(companyDir, 'gallery');

  fs.mkdirSync(galleryDir, { recursive: true });

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  const existingFiles = fs.existsSync(galleryDir) ? fs.readdirSync(galleryDir) : [];
  const existingViewports = new Set();

  existingFiles.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      const match = file.match(/^(mobile|tablet|desktop)-/);
      if (match) {
        existingViewports.add(match[1]);
      }
    }
  });

  const displayUrl = url.replace(/^https?:\/\//, '');

  for (const [viewportKey, viewport] of Object.entries(VIEWPORTS)) {
    if (existingViewports.has(viewport.name)) {
      const existingFile = existingFiles.find(f => f.startsWith(`${viewport.name}-`));
      log(`  ⊘ Skipping ${viewport.name}: already exists (${existingFile})`);
      results.skipped.push({
        viewport: viewport.name,
        filename: existingFile,
        url: displayUrl
      });
      continue;
    }
    let browser;
    let page;

    try {
      browser = await chromium.launch();

      page = await browser.newPage({
        viewport: {
          width: viewport.width,
          height: viewport.height
        }
      });

      page.setDefaultTimeout(90000);
      page.setDefaultNavigationTimeout(90000);

      log(`Navigating to ${displayUrl} [${viewport.name}]...`);

      try {

        await page.goto(url, { waitUntil: 'networkidle' });
      } catch (error) {

        log(`  ⚠ Network idle timeout for ${displayUrl} [${viewport.name}], continuing with current page state`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }


      log(`  Waiting for animations...`);
      await new Promise(resolve => setTimeout(resolve, 4000));


      const timestamp = Date.now();
      const filename = `${viewport.name}-${timestamp}.png`;
      const filepath = path.join(galleryDir, filename);

      await page.screenshot({ path: filepath, fullPage: false });

      log(`  Captured: ${filename}`);
      results.success.push({
        viewport: viewport.name,
        filename: filename,
        url: displayUrl
      });

    } catch (error) {
      log(`  Failed to capture ${viewport.name}: ${error.message}`);
      results.failed.push({
        viewport: viewport.name,
        url: displayUrl,
        error: error.message
      });
    } finally {

      try {
        if (page) await page.close();
        if (browser) await browser.close();
      } catch (e) {

      }
    }
  }

  return results;
}

async function main() {
  
  fs.writeFileSync(LOG_FILE, '');

  log('Starting screenshot capture...\n');
  log(`CSV File: ${CSV_FILE}`);
  log(`Output Directory: ${BULK_UPLOAD_MEDIA}\n`);

  
  if (!fs.existsSync(CSV_FILE)) {
    log(`Error: CSV file not found: ${CSV_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_FILE, 'utf8');
  const records = parseCSV(content);

  log(`Found ${records.length} entries in CSV\n`);

  const allResults = {
    totalUrls: 0,
    totalSuccess: 0,
    totalFailed: 0,
    byCompany: {},
    details: []
  };

  
  for (const record of records) {
    const company = record.company.trim();
    const url = record.company_url.trim();

    if (!url) {
      log(`⚠ Skipping ${company}: no company URL provided\n`);
      continue;
    }

    
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    allResults.totalUrls++;
    log(`\nProcessing: ${company}`);
    log(`URL: ${fullUrl}`);

    const results = await captureScreenshots(fullUrl, company);

    allResults.byCompany[company.toLowerCase()] = results;
    allResults.details.push({
      company: company,
      url: fullUrl,
      ...results
    });

    results.success.forEach(s => allResults.totalSuccess++);
    results.failed.forEach(f => allResults.totalFailed++);

    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  
  log('\n' + '='.repeat(60));
  log('SCREENSHOT CAPTURE SUMMARY');
  log('='.repeat(60));
  log(`Total URLs processed: ${allResults.totalUrls}`);
  log(`Total screenshots captured: ${allResults.totalSuccess}`);
  log(`Total failures: ${allResults.totalFailed}`);
  log(`Success rate: ${allResults.totalUrls > 0 ? ((allResults.totalSuccess / (allResults.totalSuccess + allResults.totalFailed)) * 100).toFixed(1) : 0}%`);
  log('='.repeat(60) + '\n');

  
  if (allResults.totalFailed > 0) {
    log('FAILED CAPTURES:\n');
    allResults.details.forEach(detail => {
      if (detail.failed.length > 0) {
        log(`${detail.company} (${detail.url}):`);
        detail.failed.forEach(fail => {
          log(`  - ${fail.viewport}: ${fail.error}`);
        });
        log('');
      }
    });
  }

  log('Screenshot capture process complete.');
  log(`Detailed log available at: ${LOG_FILE}\n`);
}

main().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
