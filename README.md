# Portfolio Plugin for WordPress

A WordPress plugin that provides a custom post type for portfolio entries with REST API access.

## Installation

1. Download or clone this plugin into `wp-content/plugins/`
2. Activate the plugin through WordPress admin

## Bulk Upload

Use the included scripts to upload projects and associated media from CSV and media files.

### Setup

1. Create a `.env` file in the plugin directory:
```
WP_URL=https://your-site.com
WP_JWT_TOKEN=your_base64_encoded_username:password
```

2. Generate the JWT token by base64 encoding your WordPress credentials:
```powershell
$base64 = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("username:password"))
Write-Host $base64
```

3. Check available categories and tags:
```bash
node check-taxonomies.js
```

This will display all available categories and tags with their IDs. Use these IDs in your CSV.

### Capture Website Screenshots

Automatically capture responsive design screenshots of your company websites at different viewport sizes.

1. Create a CSV file with company URLs (or use your existing `projects.csv`):
```bash
node screenshot-capture.js projects.csv
```

This will:
- Read all company URLs from the CSV file
- Capture 3 screenshots per URL at standard device sizes:
  - **Mobile**: 375×667 (iPhone SE)
  - **Tablet**: 768×1024 (iPad)
  - **Desktop**: 1920×1080 (Standard desktop)
- Save screenshots to `bulk-upload-media/{company-name}/gallery/`
- Files are named: `{viewport}-{timestamp}.png`
- Log results to `screenshot-capture.log`
- Continue processing even if some URLs fail

**Adding captions to screenshots:**

For each screenshot, create a `.txt` file with the same base name as the image to add a caption:
```
bulk-upload-media/
├── company-name/
    └── gallery/
        ├── mobile-1732000000.png
        ├── mobile-1732000000.txt (contains caption text)
        ├── tablet-1732000000.png
        ├── tablet-1732000000.txt
        ├── desktop-1732000000.png
        └── desktop-1732000000.txt
```

Caption files will be renamed to match the WordPress attachment IDs after upload.

### Organize Media Files

Create a `bulk-upload-media/` directory with the following structure:
```
bulk-upload-media/
├── project-name-1/
│   ├── thumbnail/
│   │   └── thumbnail-image.jpg
│   ├── gallery-image-1.jpg
│   └── gallery-image-2.jpg
└── project-name-2/
    ├── thumbnail/
    │   └── thumbnail-image.png
    └── gallery-image-1.png
```

**Directory Structure:**
- `thumbnail/` - Single thumbnail/featured image (displayed as featured media and stored in `_project_thumbnail` meta field)
- Root level - Gallery images (stored as comma-separated IDs in `_project_gallery`)
- `.txt` files - Optional captions for images (e.g., `mobile-1732000000.txt` for `mobile-1732000000.png`)

**Caption Files:**
Each image can have an optional caption by creating a `.txt` file with the same base name. The caption text will be stored in the `_project_gallery_captions` meta field as a JSON mapping of image IDs to caption text.

### Upload Media Files

```bash
node bulk-upload-media.js
```

This will:
- Upload all media to WordPress
- Rename files to their WordPress attachment IDs
- Output a media map for automatic integration

4. Prepare your CSV file with this format:
```csv
title,company,role,dateStart,dateEnd,dateType,dateFormat,subtext,content,categories,tags,company_url
"Project Title","Company","Your Role","2025-01-01","2025-12-31","range","mm/yyyy","Brief description","<p>Full description</p>","41","42,43,48","https://example.com"
```

- `categories` - Comma-separated category IDs (optional)
- `tags` - Comma-separated tag IDs (optional)
- `company_url` - Company website URL (optional)

**Note:** Company name in CSV must match the directory name in `bulk-upload-media/` (case-insensitive) for automatic media association.

### Upload Projects

```bash
node bulk-upload.js
```

Or with a custom CSV file:
```bash
node bulk-upload.js path/to/custom.csv
```

This will:
- Read projects from CSV
- Match media files by company name
- Set featured image, thumbnail, and gallery images
- Create/update all projects with associated media

**Note**: No npm installation required. The scripts use only Node.js built-in modules.

## REST API

Base endpoint: `/wp-json/wp/v2/projects`

### Authentication

The plugin uses HTTP Basic Authentication with WordPress application passwords.

Create an application password in WordPress admin → Users → Your Profile, then base64 encode as `username:password`:

```powershell
$base64 = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("username:password"))
```

### Get All Projects

```bash
curl https://example.com/wp-json/wp/v2/projects
```

Query parameters:
- `per_page=10` - Results per page
- `page=2` - Page number
- `search=keyword` - Search projects
- `orderby=date&order=asc` - Sort by date or title
- `status=publish` - Filter by status
- `categories=41` - Filter by category ID
- `tags=42,43` - Filter by tag IDs (comma-separated)

### Get Single Project

```bash
curl https://example.com/wp-json/wp/v2/projects/123
```

### Create Project (Requires Authentication)

```bash
curl -X POST https://example.com/wp-json/wp/v2/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_BASE64_CREDENTIALS" \
  -d "{
    \"title\": \"Project Title\",
    \"content\": \"<p>Description...</p>\",
    \"status\": \"publish\",
    \"categories\": [41],
    \"tags\": [42, 43, 48],
    \"meta\": {
      \"_project_subtext\": \"Tagline\",
      \"_project_role\": \"Full Stack Engineer\",
      \"_project_company\": \"Company Name\",
      \"_project_source_url\": \"https://example.com\",
      \"_project_date_type\": \"range\",
      \"_project_date_format\": \"mm/yyyy\",
      \"_project_date_start\": \"2024-01-01\",
      \"_project_date_end\": \"2024-12-31\"
    }
  }"
```

### Update Project (Requires Authentication)

```bash
curl -X POST https://example.com/wp-json/wp/v2/projects/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_BASE64_CREDENTIALS" \
  -d "{
    \"title\": \"Updated Title\",
    \"meta\": {
      \"_project_company\": \"New Company\"
    }
  }"
```

### Delete Project (Requires Authentication)

```bash
curl -X DELETE https://example.com/wp-json/wp/v2/projects/123 \
  -H "Authorization: Basic YOUR_BASE64_CREDENTIALS"
```

## Response Format

```json
{
  "id": 123,
  "title": {
    "rendered": "Project Name"
  },
  "content": {
    "rendered": "<p>Project description...</p>"
  },
  "featured_media": 456,
  "link": "https://example.com/projects/project-name/",
  "meta": {
    "_project_subtext": "Brief description",
    "_project_role": "Lead Developer",
    "_project_company": "Company Name",
    "_project_source_url": "https://example.com",
    "_project_gallery": "123,456,789",
    "_project_date_type": "range",
    "_project_date_format": "mm/yyyy",
    "_project_date_start": "2024-01-01",
    "_project_date_end": "2024-12-31"
  }
}
```

## Categories and Tags

Use WordPress categories and tags to organize portfolio entries:

- **Categories** - Organize entries by type, domain, or any custom grouping
- **Tags** - Label entries with technologies, skills, and topics

Use `check-taxonomies.js` to see available categories and tags with their IDs.

### Filter by Category/Tag

```bash
curl https://example.com/wp-json/wp/v2/projects?categories=41

curl https://example.com/wp-json/wp/v2/projects?tags=42,43
```

## Meta Fields

| Field | Meta Key | Type | Notes |
|-------|----------|------|-------|
| Subtext | `_project_subtext` | string | Brief tagline |
| Role | `_project_role` | string | Your position/role |
| Company | `_project_company` | string | Organization name |
| Company URL | `_project_company_url` | URL | Company website |
| Source URL | `_project_source_url` | URL | Live demo or repo link |
| Gallery Images | `_project_gallery` | comma-separated IDs | Media attachment IDs |
| Gallery Captions | `_project_gallery_captions` | JSON object | Image ID → caption mapping |
| Thumbnail | `_project_thumbnail` | integer | Thumbnail image attachment ID |
| Date Type | `_project_date_type` | `single` \| `range` | Single date or date range |
| Date Format | `_project_date_format` | `yyyy` \| `mm/yyyy` \| `dd/mm/yyyy` | Display format |
| Start Date | `_project_date_start` | YYYY-MM-DD | Project start date |
| End Date | `_project_date_end` | YYYY-MM-DD | Project end date (optional) |

## JavaScript Examples

### Get All Projects

```javascript
const projects = await fetch('/wp-json/wp/v2/projects').then(r => r.json());
```

### Get Single Project with Featured Image

```javascript
const response = await fetch('/wp-json/wp/v2/projects/123?_embed');
const project = await response.json();
const imageUrl = project._embedded['wp:featuredmedia'][0].source_url;
```

### Create Project

```javascript
const response = await fetch('/wp-json/wp/v2/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa('username:password')}`
  },
  body: JSON.stringify({
    title: 'New Project',
    content: '<p>Description</p>',
    status: 'publish',
    categories: [41],
    tags: [42, 43, 48],
    meta: {
      '_project_subtext': 'Tagline',
      '_project_role': 'Lead Developer',
      '_project_company': 'Company',
      '_project_source_url': 'https://example.com',
      '_project_date_type': 'range',
      '_project_date_format': 'mm/yyyy',
      '_project_date_start': '2024-01-01',
      '_project_date_end': '2024-12-31'
    }
  })
});
const project = await response.json();
```

### Get Gallery Images

```javascript
const project = await fetch('/wp-json/wp/v2/projects/123').then(r => r.json());
const galleryIds = project.meta._project_gallery.split(',');
const images = await fetch(`/wp-json/wp/v2/media?include=${galleryIds.join(',')}`).then(r => r.json());
```

## Deployment

The plugin includes automated GitHub Actions deployment to your WordPress hosting via FTP.

### Setup

1. Add these secrets to your GitHub repository:
   - `FTP_HOST` - Your FTP server hostname
   - `FTP_USER` - FTP username
   - `FTP_PASS` - FTP password

2. Commits to the `main` branch automatically deploy to your server

### Deployment Directory

Projects are deployed to: `/wp-content/plugins/portfolio-plugin/`

## Requirements

- WordPress 6.0+
- PHP 7.4+
- Node.js (for bulk upload script)
