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
const MEDIA_DIR = path.join(__dirname, 'bulk-upload-media');

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

    req.setTimeout(120000);

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

async function mediaExistsBySlug(filename) {
  try {
    const slug = path.parse(filename).name;

    const response = await fetch(`${WP_REST_API}/media?slug=${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${JWT_TOKEN}`
      }
    });

    if (!response.ok) return null;

    const media = await response.json();
    return media.length > 0 ? media[0] : null;
  } catch (error) {
    return null;
  }
}

async function uploadMedia(filePath, fileName) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const formBoundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);

    const formData = Buffer.concat([
      Buffer.from(`--${formBoundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
      fileContent,
      Buffer.from(`\r\n--${formBoundary}--\r\n`)
    ]);

    const response = await fetch(`${WP_REST_API}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
        'Authorization': `Basic ${JWT_TOKEN}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${await response.text()}`);
    }

    const media = await response.json();
    return media.id;
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error.message);
    return null;
  }
}

async function processProjectMedia(projectDir) {
  const projectName = path.basename(projectDir);
  const result = {
    gallery: [],
    galleryCaption: {},
    featured: null,
    thumbnail: null
  };

  const featuredDir = path.join(projectDir, 'featured');
  const hasFeaturedDir = fs.existsSync(featuredDir);

  if (hasFeaturedDir) {
    console.log(`\nProcessing featured image for project: ${projectName}`);
    const featuredFiles = fs.readdirSync(featuredDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    if (featuredFiles.length > 0) {
      const featuredFile = featuredFiles[0];
      const featuredPath = path.join(featuredDir, featuredFile);

      console.log(`  Checking featured: ${featuredFile}`);
      const existingMedia = await mediaExistsBySlug(featuredFile);

      if (existingMedia) {
        console.log(`    Already exists (ID: ${existingMedia.id}, slug: ${existingMedia.slug}) - Skipping upload`);
        result.thumbnail = existingMedia.id;
        result.featured = existingMedia.id;
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        console.log(`  Uploading featured: ${featuredFile}`);
        const mediaId = await uploadMedia(featuredPath, featuredFile);

        if (mediaId) {
          console.log(`    Uploaded (ID: ${mediaId})`);
          result.thumbnail = mediaId;
          result.featured = mediaId;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }

  const galleryDir = path.join(projectDir, 'gallery');
  const scanDir = fs.existsSync(galleryDir) ? galleryDir : projectDir;

  const galleryFiles = fs.readdirSync(scanDir).filter(f => {
    const fullPath = path.join(scanDir, f);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return false;
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });

  if (galleryFiles.length > 0) {
    console.log(`\nProcessing ${galleryFiles.length} gallery file(s) from project: ${projectName}`);

    for (const file of galleryFiles) {
      const filePath = path.join(scanDir, file);
      const fileName = path.parse(file).name;

      console.log(`  Checking: ${file}`);
      const existingMedia = await mediaExistsBySlug(file);

      if (existingMedia) {
        console.log(`    Already exists (ID: ${existingMedia.id}, slug: ${existingMedia.slug}) - Skipping upload`);
        result.gallery.push(existingMedia.id);

        const captionFileName = `${fileName}.txt`;
        const captionFilePath = path.join(scanDir, captionFileName);
        if (fs.existsSync(captionFilePath)) {
          const caption = fs.readFileSync(captionFilePath, 'utf8').trim();
          if (caption) {
            result.galleryCaption[existingMedia.id] = caption;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        continue;
      }

      console.log(`  Uploading: ${file}`);
      const mediaId = await uploadMedia(filePath, file);

      if (mediaId) {
        console.log(`    Uploaded (ID: ${mediaId})`);
        result.gallery.push(mediaId);

        const captionFileName = `${fileName}.txt`;
        const captionFilePath = path.join(scanDir, captionFileName);
        if (fs.existsSync(captionFilePath)) {
          const caption = fs.readFileSync(captionFilePath, 'utf8').trim();
          if (caption) {
            result.galleryCaption[mediaId] = caption;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`    Failed to upload`);
      }
    }
  }

  if (result.gallery.length === 0 && !result.featured) {
    console.log(`No media files found in ${projectName}`);
  }

  return result;
}

async function main() {
  if (!WP_URL || !JWT_TOKEN) {
    console.error('Error: Missing environment variables');
    console.error('Required: WP_URL, WP_JWT_TOKEN in .env file');
    process.exit(1);
  }

  if (!fs.existsSync(MEDIA_DIR)) {
    console.error(`Error: Media directory not found: ${MEDIA_DIR}`);
    process.exit(1);
  }

  const projectDirs = fs.readdirSync(MEDIA_DIR).filter(f => {
    const fullPath = path.join(MEDIA_DIR, f);
    return fs.statSync(fullPath).isDirectory();
  });

  if (projectDirs.length === 0) {
    console.log('No project directories found in bulk-upload-media/');
    return;
  }

  console.log('Starting media upload...\n');
  console.log(`WordPress URL: ${WP_URL}`);
  console.log(`Media Directory: ${MEDIA_DIR}`);
  console.log(`Projects to process: ${projectDirs.length}\n`);

  const mediaMap = {};
  let totalUploaded = 0;

  for (const projectDir of projectDirs) {
    const projectPath = path.join(MEDIA_DIR, projectDir);
    const result = await processProjectMedia(projectPath);

    if (result.gallery.length > 0 || result.featured || result.thumbnail) {
      mediaMap[projectDir] = result;
      totalUploaded += result.gallery.length + (result.featured ? 1 : 0) + (result.thumbnail ? 1 : 0);
    }
  }

  console.log(`\nMedia upload complete: ${totalUploaded} file(s) uploaded`);
  console.log('\nMedia map:');
  console.log(JSON.stringify(mediaMap, null, 2));
}

main().catch(console.error);
