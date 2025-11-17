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
const WP_REST_API = `${WP_URL}/wp-json/wp/v2`;
const JWT_TOKEN = process.env.WP_JWT_TOKEN;
const CSV_FILE = process.argv[2] || path.join(__dirname, 'projects.csv');

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

function loadProjectsFromCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parseCSV(content);

    return records.map(record => ({
      title: record.title,
      company: record.company,
      role: record.role,
      dateStart: record.dateStart,
      dateEnd: record.dateEnd || null,
      dateType: record.dateType || 'single',
      dateFormat: record.dateFormat || 'mm/yyyy',
      subtext: record.subtext,
      content: record.content,
      skills: record.skills ? record.skills.split(',').map(s => s.trim()) : []
    }));
  } catch (error) {
    console.error(`Error reading CSV file: ${error.message}`);
    process.exit(1);
  }
}

async function fetch(url, options = {}) {
  const https = require('https');
  const http = require('http');

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
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

async function getOrCreateTag(tagName) {
  try {
    const response = await fetch(`${WP_REST_API}/tags?search=${encodeURIComponent(tagName)}`);
    const tags = await response.json();

    if (tags.length > 0) {
      return tags[0].id;
    }

    const createResponse = await fetch(`${WP_REST_API}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${JWT_TOKEN}`
      },
      body: JSON.stringify({
        name: tagName
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create tag: ${await createResponse.text()}`);
    }

    const newTag = await createResponse.json();
    return newTag.id;
  } catch (error) {
    console.error(`  Error processing tag "${tagName}":`, error.message);
    return null;
  }
}

async function createProject(experience) {
  try {
    const tagIds = [];
    for (const skill of experience.skills) {
      const tagId = await getOrCreateTag(skill);
      if (tagId) {
        tagIds.push(tagId);
      }
    }

    const projectData = {
      title: `${experience.title} at ${experience.company}`,
      content: experience.content,
      status: 'publish',
      tags: tagIds,
      meta: {
        '_portfolio_project_subtext': experience.subtext,
        '_portfolio_project_role': experience.role,
        '_portfolio_project_company': experience.company,
        '_portfolio_project_date_type': experience.dateType,
        '_portfolio_project_date_format': experience.dateFormat,
        '_portfolio_project_date_start': experience.dateStart,
        ...(experience.dateEnd && { '_portfolio_project_date_end': experience.dateEnd })
      }
    };

    const response = await fetch(`${WP_REST_API}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${JWT_TOKEN}`
      },
      body: JSON.stringify(projectData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create project: ${await response.text()}`);
    }

    const project = await response.json();
    const title = typeof project.title === 'object' ? project.title.rendered : project.title;
    console.log(`Created: ${title} (ID: ${project.id})`);
    return project;
  } catch (error) {
    console.error(`Error creating project "${experience.title}":`, error.message);
    return null;
  }
}

async function main() {
  if (!WP_URL || !JWT_TOKEN) {
    console.error('Error: Missing environment variables');
    console.error('Required: WP_URL, WP_JWT_TOKEN in .env file');
    process.exit(1);
  }

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`Error: CSV file not found: ${CSV_FILE}`);
    process.exit(1);
  }

  const projects = loadProjectsFromCSV(CSV_FILE);

  console.log('Starting bulk upload...\n');
  console.log(`WordPress URL: ${WP_URL}`);
  console.log(`CSV File: ${CSV_FILE}`);
  console.log(`Total projects to upload: ${projects.length}\n`);

  let successCount = 0;

  for (const experience of projects) {
    const result = await createProject(experience);
    if (result) {
      successCount++;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\nUpload complete: ${successCount}/${projects.length} projects created successfully`);
}

main().catch(console.error);
