#!/usr/bin/env node

try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
} catch (error) {
  console.warn('Warning: Could not load .env file');
}

const fs = require('fs');
const path = require('path');

const WP_URL = process.env.WP_URL;
const JWT_TOKEN = process.env.WP_JWT_TOKEN;
const WP_REST_API = `${WP_URL}/wp-json/wp/v2`;

function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim().replace(/^"|"$/g, ''));

    const record = {};
    headers.forEach((header, index) => {
      record[header] = fields[index] || '';
    });
    records.push(record);
  }

  return records;
}

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? require('https') : require('http');

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 60000
    };

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: async () => {
            try {
              return JSON.parse(data);
            } catch {
              return data;
            }
          },
          text: async () => data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

async function createTag(tag) {
  try {
    const tagData = {
      name: tag.name,
      ...(tag.description && { description: tag.description })
    };

    const response = await fetch(`${WP_REST_API}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${JWT_TOKEN}`
      },
      body: JSON.stringify(tagData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const created = await response.json();
    console.log(`Created: ${created.name} (ID: ${created.id})`);
    return created;
  } catch (error) {
    console.error(`Error creating tag "${tag.name}":`, error.message);
    return null;
  }
}

async function loadTagsFromCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parseCSV(content);

    return records.map(record => ({
      name: record.name,
      description: record.description || ''
    }));
  } catch (error) {
    console.error(`Error reading CSV file: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  if (!WP_URL || !JWT_TOKEN) {
    console.error('Error: Missing environment variables');
    console.error('Required: WP_URL, WP_JWT_TOKEN in .env file');
    process.exit(1);
  }

  const csvFile = path.join(__dirname, 'tags.csv');
  if (!fs.existsSync(csvFile)) {
    console.error(`Error: ${csvFile} not found`);
    process.exit(1);
  }

  console.log('Loading tags from CSV...\n');
  const tags = await loadTagsFromCSV(csvFile);

  if (tags.length === 0) {
    console.log('No tags to create.');
    return;
  }

  console.log(`Found ${tags.length} tag(s) to create.\n`);

  let created = 0;
  for (const tag of tags) {
    const result = await createTag(tag);
    if (result) created++;
  }

  console.log(`\nCompleted: ${created}/${tags.length} tags created successfully.`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
