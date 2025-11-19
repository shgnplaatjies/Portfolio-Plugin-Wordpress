<?php

class Portfolio_Plugin_Meta_Boxes {

    public function register() {
        add_action('add_meta_boxes_project', array($this, 'add_meta_boxes'));
        add_action('save_post_project', array($this, 'save_meta_boxes'), 10, 2);
        add_action('admin_enqueue_scripts', array($this, 'enqueue_media_scripts'));
    }

    public function add_meta_boxes() {
        add_meta_box(
            'portfolio_project_details',
            'Project Details',
            array($this, 'render_project_details_box'),
            'project',
            'normal',
            'high'
        );

        add_meta_box(
            'portfolio_project_media',
            'Media Gallery',
            array($this, 'render_project_media_box'),
            'project',
            'normal',
            'default'
        );

        add_meta_box(
            'portfolio_project_meta',
            'Additional Information',
            array($this, 'render_project_meta_box'),
            'project',
            'side',
            'default'
        );
    }

    public function render_project_details_box($post) {
        wp_nonce_field('portfolio_project_nonce', 'portfolio_project_nonce');

        $subtext = get_post_meta($post->ID, '_portfolio_project_subtext', true);
        ?>
        <div class="portfolio-meta-field">
            <label for="portfolio_project_subtext">
                <strong>Subtext</strong>
                <span class="description">(Brief description of the project)</span>
            </label>
            <input
                type="text"
                id="portfolio_project_subtext"
                name="portfolio_project_subtext"
                value="<?php echo esc_attr($subtext); ?>"
                class="widefat"
                placeholder="e.g., A real-time collaboration platform built with React"
            />
        </div>
        <?php
    }

    public function render_project_media_box($post) {
        wp_nonce_field('portfolio_media_nonce', 'portfolio_media_nonce');

        $gallery_ids = get_post_meta($post->ID, '_portfolio_project_gallery', true);
        $gallery_ids = $gallery_ids ? explode(',', $gallery_ids) : array();

        ?>
        <div id="portfolio-gallery-container" class="portfolio-gallery-container">
            <button type="button" id="portfolio-add-gallery" class="button button-primary">
                Add Images to Gallery
            </button>
            <p class="description">Upload or select images to create a gallery for this project.</p>

            <div id="portfolio-gallery-list" class="portfolio-gallery-list">
                <?php
                if (!empty($gallery_ids)) {
                    foreach ($gallery_ids as $attachment_id) {
                        $attachment_id = trim($attachment_id);
                        if (!empty($attachment_id)) {
                            $thumb = wp_get_attachment_image($attachment_id, 'thumbnail');
                            echo '<div class="portfolio-gallery-item" data-attachment-id="' . esc_attr($attachment_id) . '">';
                            echo $thumb;
                            echo '<button type="button" class="portfolio-remove-image button button-small">Remove</button>';
                            echo '</div>';
                        }
                    }
                }
                ?>
            </div>

            <input
                type="hidden"
                id="portfolio_project_gallery"
                name="portfolio_project_gallery"
                value="<?php echo esc_attr(implode(',', $gallery_ids)); ?>"
            />
        </div>
        <?php
    }

    public function render_project_meta_box($post) {
        wp_nonce_field('portfolio_meta_nonce', 'portfolio_meta_nonce');

        $role = get_post_meta($post->ID, '_portfolio_project_role', true);
        $company = get_post_meta($post->ID, '_portfolio_project_company', true);
        $company_url = get_post_meta($post->ID, '_portfolio_project_company_url', true);
        $source_url = get_post_meta($post->ID, '_portfolio_project_source_url', true);
        $date_type = get_post_meta($post->ID, '_portfolio_project_date_type', true) ?: 'single';
        $date_format = get_post_meta($post->ID, '_portfolio_project_date_format', true) ?: 'mm/yyyy';
        $date_start = get_post_meta($post->ID, '_portfolio_project_date_start', true);
        $date_end = get_post_meta($post->ID, '_portfolio_project_date_end', true);

        ?>
        <div class="portfolio-meta-field">
            <label for="portfolio_project_role">
                <strong>Role</strong>
            </label>
            <input
                type="text"
                id="portfolio_project_role"
                name="portfolio_project_role"
                value="<?php echo esc_attr($role); ?>"
                class="widefat"
                placeholder="e.g., Lead Developer, Full Stack Engineer"
            />
        </div>

        <div class="portfolio-meta-field">
            <label for="portfolio_project_company">
                <strong>Company</strong>
            </label>
            <input
                type="text"
                id="portfolio_project_company"
                name="portfolio_project_company"
                value="<?php echo esc_attr($company); ?>"
                class="widefat"
                placeholder="e.g., Acme Corporation"
            />
        </div>

        <div class="portfolio-meta-field">
            <label for="portfolio_project_company_url">
                <strong>Company URL</strong>
            </label>
            <input
                type="url"
                id="portfolio_project_company_url"
                name="portfolio_project_company_url"
                value="<?php echo esc_attr($company_url); ?>"
                class="widefat"
                placeholder="https://company.com"
            />
        </div>

        <div class="portfolio-meta-field">
            <label for="portfolio_project_source_url">
                <strong>Source URL / Live Demo</strong>
            </label>
            <input
                type="url"
                id="portfolio_project_source_url"
                name="portfolio_project_source_url"
                value="<?php echo esc_attr($source_url); ?>"
                class="widefat"
                placeholder="https://example.com"
            />
        </div>

        <div class="portfolio-meta-field">
            <label for="portfolio_project_date_type">
                <strong>Time Period Type</strong>
            </label>
            <select id="portfolio_project_date_type" name="portfolio_project_date_type" class="widefat">
                <option value="single" <?php selected($date_type, 'single'); ?>>Single Date</option>
                <option value="range" <?php selected($date_type, 'range'); ?>>Date Range</option>
            </select>
        </div>

        <div class="portfolio-meta-field">
            <label for="portfolio_project_date_format">
                <strong>Date Format</strong>
            </label>
            <select id="portfolio_project_date_format" name="portfolio_project_date_format" class="widefat">
                <option value="yyyy" <?php selected($date_format, 'yyyy'); ?>>Year Only (yyyy)</option>
                <option value="mm/yyyy" <?php selected($date_format, 'mm/yyyy'); ?>>Month/Year (mm/yyyy)</option>
                <option value="dd/mm/yyyy" <?php selected($date_format, 'dd/mm/yyyy'); ?>>Full Date (dd/mm/yyyy)</option>
            </select>
        </div>

        <div class="portfolio-meta-field">
            <label for="portfolio_project_date_start">
                <strong>Start Date</strong>
            </label>
            <input
                type="date"
                id="portfolio_project_date_start"
                name="portfolio_project_date_start"
                value="<?php echo esc_attr($date_start); ?>"
                class="widefat portfolio-date-input"
            />
        </div>

        <div class="portfolio-meta-field" id="portfolio-date-end-field" style="display: <?php echo $date_type === 'range' ? 'block' : 'none'; ?>;">
            <label for="portfolio_project_date_end">
                <strong>End Date</strong>
            </label>
            <input
                type="date"
                id="portfolio_project_date_end"
                name="portfolio_project_date_end"
                value="<?php echo esc_attr($date_end); ?>"
                class="widefat portfolio-date-input"
            />
            <small class="description">Leave empty for current/ongoing</small>
        </div>

        <script>
            jQuery(document).ready(function($) {
                $('#portfolio_project_date_type').on('change', function() {
                    if ($(this).val() === 'range') {
                        $('#portfolio-date-end-field').show();
                    } else {
                        $('#portfolio-date-end-field').hide();
                    }
                });
            });
        </script>
        <?php
    }

    public function save_meta_boxes($post_id, $post) {
        if (!isset($_POST['portfolio_project_nonce']) || !wp_verify_nonce($_POST['portfolio_project_nonce'], 'portfolio_project_nonce')) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (isset($_POST['portfolio_project_subtext'])) {
            update_post_meta($post_id, '_portfolio_project_subtext', sanitize_text_field($_POST['portfolio_project_subtext']));
        }

        if (isset($_POST['portfolio_project_gallery'])) {
            $gallery_ids = sanitize_text_field($_POST['portfolio_project_gallery']);
            update_post_meta($post_id, '_portfolio_project_gallery', $gallery_ids);
        }

        if (isset($_POST['portfolio_project_role'])) {
            update_post_meta($post_id, '_portfolio_project_role', sanitize_text_field($_POST['portfolio_project_role']));
        }

        if (isset($_POST['portfolio_project_company'])) {
            update_post_meta($post_id, '_portfolio_project_company', sanitize_text_field($_POST['portfolio_project_company']));
        }

        if (isset($_POST['portfolio_project_company_url'])) {
            update_post_meta($post_id, '_portfolio_project_company_url', esc_url_raw($_POST['portfolio_project_company_url']));
        }

        if (isset($_POST['portfolio_project_source_url'])) {
            update_post_meta($post_id, '_portfolio_project_source_url', esc_url_raw($_POST['portfolio_project_source_url']));
        }

        if (isset($_POST['portfolio_project_date_type'])) {
            update_post_meta($post_id, '_portfolio_project_date_type', sanitize_text_field($_POST['portfolio_project_date_type']));
        }

        if (isset($_POST['portfolio_project_date_format'])) {
            update_post_meta($post_id, '_portfolio_project_date_format', sanitize_text_field($_POST['portfolio_project_date_format']));
        }

        if (isset($_POST['portfolio_project_date_start'])) {
            update_post_meta($post_id, '_portfolio_project_date_start', sanitize_text_field($_POST['portfolio_project_date_start']));
        }

        if (isset($_POST['portfolio_project_date_end'])) {
            update_post_meta($post_id, '_portfolio_project_date_end', sanitize_text_field($_POST['portfolio_project_date_end']));
        }
    }

    public function enqueue_media_scripts() {
        $current_screen = get_current_screen();

        if ($current_screen && $current_screen->post_type === 'project') {
            wp_enqueue_media();
            wp_enqueue_script(
                'portfolio-media-gallery',
                PORTFOLIO_PLUGIN_URL . 'assets/js/gallery.js',
                array('jquery', 'wp-util'),
                PORTFOLIO_PLUGIN_VERSION,
                true
            );
        }
    }
}
