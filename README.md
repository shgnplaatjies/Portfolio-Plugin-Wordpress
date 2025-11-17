# Portfolio Plugin for WordPress

A WordPress plugin that provides a "Projects" custom post type accessible via REST API.

## Installation

1. Download or clone this plugin into `wp-content/plugins/`
2. Activate the plugin through WordPress admin

## REST API

Base endpoint: `/wp-json/wp/v2/projects`

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
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Project Title",
    "content": "<p>Description...</p>",
    "status": "publish",
    "meta": {
      "_portfolio_project_subtext": "Tagline",
      "_portfolio_project_role": "Full Stack Engineer",
      "_portfolio_project_company": "Company Name",
      "_portfolio_project_source_url": "https://example.com",
      "_portfolio_project_date_type": "single",
      "_portfolio_project_date_format": "mm/yyyy",
      "_portfolio_project_date_start": "11/2024"
    }
  }'
```

### Update Project (Requires Authentication)

```bash
curl -X POST https://example.com/wp-json/wp/v2/projects/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
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
    "_portfolio_project_date_start": "01/2024",
    "_portfolio_project_date_end": "11/2024"
  }
}
```

## Meta Fields

| Field | Meta Key | Type |
|-------|----------|------|
| Subtext | `_portfolio_project_subtext` | string |
| Role | `_portfolio_project_role` | string |
| Company | `_portfolio_project_company` | string |
| Source URL | `_portfolio_project_source_url` | URL |
| Gallery Images | `_portfolio_project_gallery` | comma-separated IDs |
| Date Type | `_portfolio_project_date_type` | `single` \| `range` |
| Date Format | `_portfolio_project_date_format` | `yyyy` \| `mm/yyyy` \| `dd/mm/yyyy` |
| Start Date | `_portfolio_project_date_start` | string |
| End Date | `_portfolio_project_date_end` | string |

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
    'Authorization': `Bearer ${token}`
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
      '_portfolio_project_date_type': 'single',
      '_portfolio_project_date_format': 'mm/yyyy',
      '_portfolio_project_date_start': '11/2024'
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

## Requirements

- WordPress 6.0+
- PHP 7.4+
