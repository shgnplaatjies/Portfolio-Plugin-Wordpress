# Portfolio Plugin for WordPress 6.8+

A custom WordPress plugin providing professional portfolio/career management post types for Software Engineers and other professionals.

## Features

### Project Post Type

A custom post type for showcasing professional projects with the following features:

#### Required Fields
- **Title** - The name of the project

#### Optional Fields

- **Featured Image** - Project thumbnail/hero image
- **Subtext** - Brief description or tagline (e.g., "A real-time collaboration platform")
- **Description** - Full project description with HTML support (rich text editor)
- **Media Gallery** - Multiple images with drag-and-drop reordering
- **Company** - Organization or client name
- **Source URL** - Live demo or repository link
- **Time Period** - Project duration with flexible date formatting:
  - **Date Type**: Single date or date range
  - **Date Format**:
    - Year only (yyyy)
    - Month/Year (mm/yyyy)
    - Full date (dd/mm/yyyy)
  - **Start Date**: When the project started
  - **End Date**: When the project ended (optional for ongoing projects)

## Installation

1. Download or clone this plugin into your WordPress `wp-content/plugins/` directory
2. Activate the plugin through the WordPress admin panel (Plugins > Installed Plugins)
3. Navigate to "Projects" in the admin menu to start creating project posts

## Usage

### Creating a Project (WordPress Admin)

1. Go to **Projects** in the WordPress admin
2. Click **Add New Project**
3. Enter the project title (required)
4. Fill in optional fields as needed:
   - Set a featured image by clicking "Set featured image"
   - Add subtext describing the project briefly
   - Write a detailed description using the rich text editor
   - Add images to the media gallery
   - Enter company name and source URL
   - Set the project timeline with appropriate date formatting
5. Click **Publish**

### Admin Features

#### Media Gallery Manager
- Click "Add Images to Gallery" to open the WordPress media library
- Select multiple images at once
- Drag and drop to reorder images
- Remove individual images with the "Remove" button
- Gallery order is preserved and saved with the post

#### Rich Text Editor
- Full WordPress editor for project descriptions
- Supports HTML formatting, media, and more
- All standard editor features available

#### Flexible Date Handling
- Choose between single date or date range
- Multiple date format options for flexibility
- End date is optional for ongoing projects

## REST API Documentation

The Portfolio Plugin provides full REST API support for accessing and managing projects programmatically.

### Base Endpoint
```
/wp-json/wp/v2/projects
```

### Retrieving Projects

#### Get All Projects
```bash
curl https://example.com/wp-json/wp/v2/projects
```

#### Response Example
```json
[
  {
    "id": 123,
    "date": "2024-11-16T10:30:00",
    "date_gmt": "2024-11-16T10:30:00",
    "guid": {
      "rendered": "https://example.com/?p=123"
    },
    "modified": "2024-11-16T10:30:00",
    "modified_gmt": "2024-11-16T10:30:00",
    "slug": "my-awesome-project",
    "status": "publish",
    "type": "project",
    "link": "https://example.com/projects/my-awesome-project/",
    "title": {
      "rendered": "My Awesome Project"
    },
    "content": {
      "rendered": "<p>Full HTML content of the project...</p>",
      "protected": false
    },
    "excerpt": {
      "rendered": "",
      "protected": false
    },
    "featured_media": 456,
    "comment_status": "open",
    "ping_status": "open",
    "sticky": false,
    "template": "",
    "format": "standard",
    "meta": {
      "_portfolio_project_subtext": "A real-time collaboration platform",
      "_portfolio_project_description": "<p>Detailed project description...</p>",
      "_portfolio_project_company": "Acme Corporation",
      "_portfolio_project_source_url": "https://example-project.com",
      "_portfolio_project_gallery": "456,457,458",
      "_portfolio_project_date_type": "range",
      "_portfolio_project_date_format": "mm/yyyy",
      "_portfolio_project_date_start": "01/2023",
      "_portfolio_project_date_end": "06/2024"
    }
  }
]
```

#### Query Parameters

##### Pagination
```bash
# Get 10 projects per page, page 2
curl "https://example.com/wp-json/wp/v2/projects?per_page=10&page=2"
```

##### Search
```bash
# Search for projects matching a keyword
curl "https://example.com/wp-json/wp/v2/projects?search=react"
```

##### Sorting
```bash
# Sort by date (ascending)
curl "https://example.com/wp-json/wp/v2/projects?orderby=date&order=asc"

# Sort by title
curl "https://example.com/wp-json/wp/v2/projects?orderby=title&order=asc"
```

##### Filtering
```bash
# Get only published projects
curl "https://example.com/wp-json/wp/v2/projects?status=publish"

# Get all posts (requires authentication)
curl "https://example.com/wp-json/wp/v2/projects?status=publish,draft"
```

### Getting a Single Project
```bash
curl https://example.com/wp-json/wp/v2/projects/123
```

### Creating a Project (Requires Authentication)

```bash
curl -X POST https://example.com/wp-json/wp/v2/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "New Project",
    "content": "<p>Project description...</p>",
    "status": "publish",
    "meta": {
      "_portfolio_project_subtext": "Project tagline",
      "_portfolio_project_company": "Company Name",
      "_portfolio_project_source_url": "https://example.com",
      "_portfolio_project_date_type": "single",
      "_portfolio_project_date_format": "mm/yyyy",
      "_portfolio_project_date_start": "11/2024"
    }
  }'
```

### Updating a Project (Requires Authentication)

```bash
curl -X POST https://example.com/wp-json/wp/v2/projects/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Updated Project Title",
    "meta": {
      "_portfolio_project_company": "New Company"
    }
  }'
```

### Deleting a Project (Requires Authentication)

```bash
curl -X DELETE https://example.com/wp-json/wp/v2/projects/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Featured Image Handling

#### Get Featured Image URL
The featured media ID is included in the response. To get image details:

```bash
curl https://example.com/wp-json/wp/v2/media/456
```

#### Response
```json
{
  "id": 456,
  "date": "2024-11-16T10:30:00",
  "slug": "project-image",
  "type": "attachment",
  "link": "https://example.com/project-image/",
  "title": {
    "rendered": "Project Image"
  },
  "author": 1,
  "description": {
    "rendered": ""
  },
  "caption": {
    "rendered": ""
  },
  "alt_text": "",
  "media_type": "image",
  "mime_type": "image/jpeg",
  "media_details": {
    "width": 1200,
    "height": 800,
    "sizes": {
      "thumbnail": {
        "file": "project-image-150x150.jpg",
        "width": 150,
        "height": 150,
        "mime_type": "image/jpeg",
        "source_url": "https://example.com/wp-content/uploads/2024/11/project-image-150x150.jpg"
      },
      "medium": {
        "file": "project-image-300x200.jpg",
        "width": 300,
        "height": 200,
        "mime_type": "image/jpeg",
        "source_url": "https://example.com/wp-content/uploads/2024/11/project-image-300x200.jpg"
      },
      "full": {
        "file": "project-image.jpg",
        "width": 1200,
        "height": 800,
        "mime_type": "image/jpeg",
        "source_url": "https://example.com/wp-content/uploads/2024/11/project-image.jpg"
      }
    }
  },
  "source_url": "https://example.com/wp-content/uploads/2024/11/project-image.jpg"
}
```

### JavaScript/Fetch Examples

#### Get All Projects
```javascript
async function getProjects() {
  const response = await fetch('/wp-json/wp/v2/projects');
  const projects = await response.json();
  return projects;
}

// Usage
getProjects().then(projects => {
  projects.forEach(project => {
    console.log(project.title.rendered);
    console.log(project.meta._portfolio_project_company);
  });
});
```

#### Get Single Project with Featured Image
```javascript
async function getProjectWithImage(projectId) {
  const response = await fetch(`/wp-json/wp/v2/projects/${projectId}?_embed`);
  const project = await response.json();

  // Featured image is in _embedded
  if (project._embedded && project._embedded['wp:featuredmedia']) {
    const image = project._embedded['wp:featuredmedia'][0];
    console.log('Featured image URL:', image.source_url);
  }

  return project;
}
```

#### Create New Project
```javascript
async function createProject(projectData) {
  const token = localStorage.getItem('wp_token'); // Your JWT token

  const response = await fetch('/wp-json/wp/v2/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: projectData.title,
      content: projectData.description,
      status: 'publish',
      meta: {
        '_portfolio_project_subtext': projectData.subtext,
        '_portfolio_project_company': projectData.company,
        '_portfolio_project_source_url': projectData.sourceUrl,
        '_portfolio_project_date_type': projectData.dateType,
        '_portfolio_project_date_format': projectData.dateFormat,
        '_portfolio_project_date_start': projectData.dateStart,
        '_portfolio_project_date_end': projectData.dateEnd || ''
      }
    })
  });

  return response.json();
}

// Usage
createProject({
  title: 'My New Project',
  description: '<p>Project details...</p>',
  subtext: 'A quick summary',
  company: 'My Company',
  sourceUrl: 'https://example.com',
  dateType: 'range',
  dateFormat: 'mm/yyyy',
  dateStart: '01/2024',
  dateEnd: '11/2024'
});
```

#### Update Project
```javascript
async function updateProject(projectId, updates) {
  const token = localStorage.getItem('wp_token');

  const response = await fetch(`/wp-json/wp/v2/projects/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  return response.json();
}

// Usage
updateProject(123, {
  meta: {
    '_portfolio_project_company': 'Updated Company Name'
  }
});
```

#### Get Gallery Images
```javascript
async function getProjectGallery(projectId) {
  const response = await fetch(`/wp-json/wp/v2/projects/${projectId}`);
  const project = await response.json();

  const galleryIds = project.meta._portfolio_project_gallery.split(',').filter(Boolean);

  // Fetch all media items
  const mediaResponse = await fetch(
    `/wp-json/wp/v2/media?include=${galleryIds.join(',')}`
  );
  const mediaItems = await mediaResponse.json();

  return mediaItems;
}

// Usage
getProjectGallery(123).then(images => {
  images.forEach(image => {
    console.log(image.source_url);
  });
});
```

## Meta Field Keys

For reference when accessing project metadata via REST API or PHP:

| Field | Meta Key | Type | Example |
|-------|----------|------|---------|
| Subtext | `_portfolio_project_subtext` | string | "Real-time collaboration platform" |
| Description | `_portfolio_project_description` | HTML/rich text | "<p>Details...</p>" |
| Company | `_portfolio_project_company` | string | "Acme Corp" |
| Source URL | `_portfolio_project_source_url` | URL | "https://example.com" |
| Gallery Images | `_portfolio_project_gallery` | comma-separated IDs | "123,456,789" |
| Date Type | `_portfolio_project_date_type` | `single` \| `range` | "range" |
| Date Format | `_portfolio_project_date_format` | `yyyy` \| `mm/yyyy` \| `dd/mm/yyyy` | "mm/yyyy" |
| Start Date | `_portfolio_project_date_start` | string | "01/2023" |
| End Date | `_portfolio_project_date_end` | string | "11/2024" |

## Customization

### Styling the Post Type

The plugin is theme-agnostic and provides minimal styling. To customize the appearance:

1. Create custom post type templates in your theme:
   - `archive-project.php` - Project listing page
   - `single-project.php` - Individual project page

2. Example template structure:
```php
<?php get_header(); ?>

<main>
    <?php if (have_posts()) : ?>
        <?php while (have_posts()) : the_post(); ?>
            <article>
                <?php the_post_thumbnail('large'); ?>
                <h1><?php the_title(); ?></h1>

                <p><?php echo get_post_meta(get_the_ID(), '_portfolio_project_subtext', true); ?></p>

                <div>
                    <?php the_content(); ?>
                </div>

                <?php
                $company = get_post_meta(get_the_ID(), '_portfolio_project_company', true);
                if ($company) {
                    echo '<p><strong>Company:</strong> ' . esc_html($company) . '</p>';
                }

                $source_url = get_post_meta(get_the_ID(), '_portfolio_project_source_url', true);
                if ($source_url) {
                    echo '<a href="' . esc_url($source_url) . '" target="_blank">View Live</a>';
                }
                ?>
            </article>
        <?php endwhile; ?>
    <?php endif; ?>
</main>

<?php get_footer(); ?>
```

### Extending the Plugin

To add additional post types in the future:

1. Create a new class in `includes/class-post-type-[name].php`
2. Follow the pattern of `class-post-type-project.php`
3. Register it in the main `portfolio-plugin.php` file

## Technical Details

- **Minimum WordPress Version**: 6.0
- **Minimum PHP Version**: 7.4
- **REST API Support**: Yes (`/wp-json/wp/v2/projects`)
- **Taxonomy Support**: None (extensible)
- **Supports**: Title, Editor, Excerpt, Featured Image, Custom Fields, Revisions
