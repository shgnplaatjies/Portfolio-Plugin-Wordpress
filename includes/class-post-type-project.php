<?php
/**
 * Project Post Type Registration
 *
 * Handles the registration and setup of the Project custom post type
 */

class Portfolio_Plugin_Post_Type_Project {

    /**
     * Register the Project custom post type
     */
    public function register() {
        register_post_type('project', array(
            'labels' => array(
                'name'               => 'Projects',
                'singular_name'      => 'Project',
                'menu_name'          => 'Projects',
                'add_new'            => 'Add New Project',
                'add_new_item'       => 'Add New Project',
                'edit_item'          => 'Edit Project',
                'new_item'           => 'New Project',
                'view_item'          => 'View Project',
                'view_items'         => 'View Projects',
                'search_items'       => 'Search Projects',
                'not_found'          => 'No projects found',
                'not_found_in_trash' => 'No projects found in trash',
                'all_items'          => 'All Projects',
                'archives'           => 'Project Archives',
            ),
            'public'              => true,
            'publicly_queryable'  => true,
            'show_ui'             => true,
            'show_in_menu'        => true,
            'show_in_nav_menus'   => true,
            'show_in_rest'        => true,
            'rest_base'           => 'projects',
            'has_archive'         => true,
            'rewrite'             => array(
                'slug'       => 'projects',
                'with_front' => true,
            ),
            'query_var'           => true,
            'capability_type'     => 'post',
            'supports'            => array(
                'title',
                'editor',
                'excerpt',
                'thumbnail',
                'custom-fields',
                'revisions',
            ),
            'taxonomies'          => array(),
            'menu_icon'           => 'dashicons-briefcase',
            'hierarchical'        => false,
        ));
    }
}
