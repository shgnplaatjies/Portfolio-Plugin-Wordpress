# Portfolio Plugin for WordPress

A WordPress plugin that provides a "Projects" custom post type accessible via REST API.

## Installation

1. Download or clone this plugin into `wp-content/plugins/`
2. Activate the plugin through WordPress admin

## Bulk Upload

Use the included `bulk-upload.js` script to create multiple projects from a CSV file.

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

3. Prepare your CSV file with this format:
```csv
title,company,role,dateStart,dateEnd,dateType,dateFormat,subtext,content,skills
"Project Title","Company","Your Role","2025-01-01","2025-12-31","range","mm/yyyy","Brief description","<p>Full description</p>","Skill1, Skill2, Skill3"
```

### Run the Upload

```bash
node bulk-upload.js
```

Or with a custom CSV file:
```bash
node bulk-upload.js path/to/custom.csv
```

**Note**: No npm installation required. The script uses only Node.js built-in modules.

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

### Get Single Project

```bash
curl https://example.com/wp-json/wp/v2/projects/123
```

### Create Project (Requires Authentication)

```bash
curl -X POST https://example.com/wp-json/wp/v2/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_BASE64_CREDENTIALS" \
  -d '{
    "title": "Project Title",
    "content": "<p>Description...</p>",
    "status": "publish",
    "meta": {
      "_portfolio_project_subtext": "Tagline",
      "_portfolio_project_role": "Full Stack Engineer",
      "_portfolio_project_company": "Company Name",
      "_portfolio_project_source_url": "https://example.com",
      "_portfolio_project_date_type": "range",
      "_portfolio_project_date_format": "mm/yyyy",
      "_portfolio_project_date_start": "2024-01-01",
      "_portfolio_project_date_end": "2024-12-31"
    }
  }'
```

### Update Project (Requires Authentication)

```bash
curl -X POST https://example.com/wp-json/wp/v2/projects/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_BASE64_CREDENTIALS" \
  -d '{
    "title": "Updated Title",
    "meta": {
      "_portfolio_project_company": "New Company"
    }
  }'
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
    "_portfolio_project_subtext": "Brief description",
    "_portfolio_project_role": "Lead Developer",
    "_portfolio_project_company": "Company Name",
    "_portfolio_project_source_url": "https://example.com",
    "_portfolio_project_gallery": "123,456,789",
    "_portfolio_project_date_type": "range",
    "_portfolio_project_date_format": "mm/yyyy",
    "_portfolio_project_date_start": "2024-01-01",
    "_portfolio_project_date_end": "2024-12-31"
  }
}
```

## Meta Fields

| Field | Meta Key | Type | Notes |
|-------|----------|------|-------|
| Subtext | `_portfolio_project_subtext` | string | Brief tagline |
| Role | `_portfolio_project_role` | string | Your position/role |
| Company | `_portfolio_project_company` | string | Organization name |
| Source URL | `_portfolio_project_source_url` | URL | Live demo or repo link |
| Gallery Images | `_portfolio_project_gallery` | comma-separated IDs | Media attachment IDs |
| Date Type | `_portfolio_project_date_type` | `single` \| `range` | Single date or date range |
| Date Format | `_portfolio_project_date_format` | `yyyy` \| `mm/yyyy` \| `dd/mm/yyyy` | Display format |
| Start Date | `_portfolio_project_date_start` | YYYY-MM-DD | Project start date |
| End Date | `_portfolio_project_date_end` | YYYY-MM-DD | Project end date (optional) |

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
    meta: {
      '_portfolio_project_subtext': 'Tagline',
      '_portfolio_project_role': 'Lead Developer',
      '_portfolio_project_company': 'Company',
      '_portfolio_project_source_url': 'https://example.com',
      '_portfolio_project_date_type': 'range',
      '_portfolio_project_date_format': 'mm/yyyy',
      '_portfolio_project_date_start': '2024-01-01',
      '_portfolio_project_date_end': '2024-12-31'
    }
  })
});
const project = await response.json();
```

### Get Gallery Images

```javascript
const project = await fetch('/wp-json/wp/v2/projects/123').then(r => r.json());
const galleryIds = project.meta._portfolio_project_gallery.split(',');
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
