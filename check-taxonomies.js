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

const https = require('https');
const http = require('http');

const WP_URL = process.env.WP_URL;
const WP_REST_API = `${WP_URL}/wp-json/wp/v2`;
const JWT_TOKEN = process.env.WP_JWT_TOKEN;

async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 60000
    };

    const req = client.request(url, reqOptions, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function main() {
  if (!WP_URL || !JWT_TOKEN) {
    console.error('Error: Missing environment variables');
    console.error('Required: WP_URL, WP_JWT_TOKEN in .env file');
    process.exit(1);
  }

  console.log('Fetching available taxonomies...\n');

  try {
    console.log('CATEGORIES:');
    console.log('===========\n');
    const categoriesResponse = await fetch(`${WP_REST_API}/categories?per_page=100`);
    const categories = await categoriesResponse.json();

    if (categories.length === 0) {
      console.log('No categories found.\n');
    } else {
      categories.forEach(cat => {
        console.log(`ID: ${cat.id} | Name: ${cat.name} | Slug: ${cat.slug}`);
      });
      console.log();
    }

    console.log('TAGS:');
    console.log('=====\n');
    const tagsResponse = await fetch(`${WP_REST_API}/tags?per_page=100`);
    const tags = await tagsResponse.json();

    if (tags.length === 0) {
      console.log('No tags found.\n');
    } else {
      tags.forEach(tag => {
        console.log(`ID: ${tag.id} | Name: ${tag.name} | Slug: ${tag.slug}`);
      });
      console.log();
    }

    console.log('To use categories/tags in your CSV:');
    console.log('- Add a "categories" column with comma-separated category IDs');
    console.log('- Add a "tags" column with comma-separated tag IDs');
    console.log('Example: categories="1,2" tags="5,10"');
  } catch (error) {
    console.error('Error fetching taxonomies:', error.message);
    process.exit(1);
  }
}

main();
