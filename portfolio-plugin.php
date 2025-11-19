<?php
/**
 * Plugin Name: Show Don't Tell - Portfolio Plugin
 * Plugin URI: https://shaganplaatjies.co.za/portfolio-plugin
 * Description: A custom WordPress plugin providing portfolio/career management post types for professionals
 * Version: 0.0.1
 * Author: Shagan Plaatjies
 * Author URI: https://shaganplaatjies.co.za
 * Text Domain: portfolio-plugin
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PORTFOLIO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PORTFOLIO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PORTFOLIO_PLUGIN_VERSION', '1.0.0');

require_once PORTFOLIO_PLUGIN_DIR . 'includes/class-post-type-project.php';
require_once PORTFOLIO_PLUGIN_DIR . 'includes/class-meta-boxes.php';

add_action('init', function() {
    $project_post_type = new Portfolio_Plugin_Post_Type_Project();
    $project_post_type->register();

    $meta_boxes = new Portfolio_Plugin_Meta_Boxes();
    $meta_boxes->register();
});

add_action('rest_api_init', function() {
    $meta_fields = array(
        '_project_subtext',
        '_project_role',
        '_project_company',
        '_project_company_url',
        '_project_source_url',
        '_project_gallery',
        '_project_gallery_captions',
        '_project_thumbnail',
        '_project_date_type',
        '_project_date_format',
        '_project_date_start',
        '_project_date_end'
    );

    foreach ($meta_fields as $field) {
        register_meta('post', $field, array(
            'object_subtype' => 'project',
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
    }
});

register_activation_hook(__FILE__, function() {
    $project_post_type = new Portfolio_Plugin_Post_Type_Project();
    $project_post_type->register();
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});

add_action('admin_enqueue_scripts', function() {
    $current_screen = get_current_screen();

    if ($current_screen && $current_screen->post_type === 'project') {
        wp_enqueue_style(
            'portfolio-plugin-admin',
            PORTFOLIO_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            PORTFOLIO_PLUGIN_VERSION
        );

        wp_enqueue_script(
            'portfolio-plugin-admin',
            PORTFOLIO_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'wp-media'),
            PORTFOLIO_PLUGIN_VERSION,
            true
        );

        wp_localize_script('portfolio-plugin-admin', 'portfolioPlugin', array(
            'nonce' => wp_create_nonce('portfolio_plugin_nonce'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
        ));
    }
});
