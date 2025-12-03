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

function loadMediaGallery() {
  try {
    const mediaDir = path.join(__dirname, 'bulk-upload-media');
    const mediaMap = {};

    if (!fs.existsSync(mediaDir)) {
      return mediaMap;
    }

    const projectDirs = fs.readdirSync(mediaDir).filter(f => {
      const fullPath = path.join(mediaDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    projectDirs.forEach(projectName => {
      const projectPath = path.join(mediaDir, projectName);

      const galleryDir = path.join(projectPath, 'gallery');
      const scanDir = fs.existsSync(galleryDir) ? galleryDir : projectPath;

      const files = fs.readdirSync(scanDir).filter(f => {
        const fullPath = path.join(scanDir, f);
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) return false;
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      });

      if (files.length > 0) {
        const ids = files.map(f => {
          const name = path.parse(f).name;
          return parseInt(name);
        }).filter(id => !isNaN(id));

        if (ids.length > 0) {
          const captions = {};
          ids.forEach(id => {
            const captionFile = path.join(scanDir, `${id}.txt`);
            if (fs.existsSync(captionFile)) {
              const caption = fs.readFileSync(captionFile, 'utf8').trim();
              if (caption) {
                captions[id] = caption;
              }
            }
          });

          const projectKey = projectName.toLowerCase();
          mediaMap[projectKey] = {
            gallery: ids.join(','),
            galleryCaption: captions,
            featured: null,
            thumbnail: null
          };
        }
      }

      const featuredDir = path.join(projectPath, 'featured');
      if (fs.existsSync(featuredDir)) {
        const featuredFiles = fs.readdirSync(featuredDir).filter(f => {
          const ext = path.extname(f).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });

        if (featuredFiles.length > 0) {
          const name = path.parse(featuredFiles[0]).name;
          const featuredId = parseInt(name);
          if (!isNaN(featuredId)) {
            const projectKey = projectName.toLowerCase();
            if (!mediaMap[projectKey]) {
              mediaMap[projectKey] = { gallery: '', galleryCaption: {}, featured: null, thumbnail: null };
            }
            mediaMap[projectKey].thumbnail = featuredId;
            mediaMap[projectKey].featured = featuredId;
          }
        }
      }
    });

    return mediaMap;
  } catch (error) {
    console.warn('Warning: Could not load media gallery:', error.message);
    return {};
  }
}

function loadProjectsFromCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parseCSV(content);
    const mediaMap = loadMediaGallery();

    return records.map(record => {
      const companyKey = record.company.toLowerCase();
      const companyMedia = mediaMap[companyKey] || { gallery: '', galleryCaption: {}, featured: null, thumbnail: null };
      return {
        title: record.title,
        company: record.company,
        role: record.role,
        dateStart: record.dateStart,
        dateEnd: record.dateEnd || null,
        dateType: record.dateType || 'single',
        dateFormat: record.dateFormat || 'mm/yyyy',
        subtext: record.subtext,
        content: record.content,
        companyUrl: record.company_url || '',
        gallery: companyMedia.gallery || '',
        galleryCaption: companyMedia.galleryCaption || {},
        featured: companyMedia.featured || null,
        thumbnail: companyMedia.thumbnail || null,
        categories: record.categories ? record.categories.split(',').map(c => parseInt(c.trim())) : [],
        tags: record.tags ? record.tags.split(',').map(t => parseInt(t.trim())) : []
      };
    });
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

async function createProject(project) {
  try {
    const allTags = project.tags;

    const projectData = {
      title: `${project.title} at ${project.company}`,
      content: project.content,
      status: 'publish',
      ...(project.categories.length > 0 && { categories: project.categories }),
      ...(allTags.length > 0 && { tags: allTags }),
      ...(project.featured && { featured_media: project.featured }),
      meta: {
        '_project_subtext': project.subtext,
        '_project_role': project.role,
        '_project_company': project.company,
        ...(project.companyUrl && { '_project_company_url': project.companyUrl }),
        ...(project.gallery && { '_project_gallery': project.gallery }),
        ...(Object.keys(project.galleryCaption).length > 0 && { '_project_gallery_captions': JSON.stringify(project.galleryCaption) }),
        ...(project.thumbnail && { '_project_thumbnail': String(project.thumbnail) }),
        '_project_date_type': project.dateType,
        '_project_date_format': project.dateFormat,
        '_project_date_start': project.dateStart,
        ...(project.dateEnd && { '_project_date_end': project.dateEnd })
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

    const projectResponse = await response.json();
    const title = typeof projectResponse.title === 'object' ? projectResponse.title.rendered : projectResponse.title;
    console.log(`Created: ${title} (ID: ${projectResponse.id})`);
    return projectResponse;
  } catch (error) {
    console.error(`Error creating project "${project.title}":`, error.message);
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

  for (const project of projects) {
    const result = await createProject(project);
    if (result) {
      successCount++;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\nUpload complete: ${successCount}/${projects.length} projects created successfully`);
}

main().catch(console.error);
