/**
 * Portfolio Plugin - Media Gallery Handler
 * Handles the selection and management of images for project galleries
 */

jQuery(document).ready(function($) {
    let mediaFrame;

    /**
     * Open media library for selecting gallery images
     */
    $('#portfolio-add-gallery').on('click', function(e) {
        e.preventDefault();

        if (mediaFrame) {
            mediaFrame.open();
            return;
        }

        mediaFrame = wp.media({
            title: 'Select Images for Gallery',
            button: {
                text: 'Add to Gallery'
            },
            multiple: true,
            library: {
                type: 'image'
            }
        });

        /**
         * Handle media selection
         */
        mediaFrame.on('select', function() {
            const selectedImages = mediaFrame.state().get('selection');
            const currentIds = $('#portfolio_project_gallery').val().split(',').filter(Boolean);

            selectedImages.each(function(attachment) {
                const id = attachment.id;

                if ($.inArray(id.toString(), currentIds) === -1) {
                    addGalleryItem(attachment);
                    currentIds.push(id.toString());
                }
            });

            $('#portfolio_project_gallery').val(currentIds.join(','));
        });

        mediaFrame.open();
    });

    /**
     * Add a gallery item to the display
     */
    function addGalleryItem(attachment) {
        const id = attachment.id;
        const imageUrl = attachment.url;

        if (!imageUrl) return;

        const $item = $(`
            <div class="portfolio-gallery-item" data-attachment-id="${id}">
                <img src="${imageUrl}" alt="Gallery Image" />
                <button type="button" class="portfolio-remove-image button button-small">Remove</button>
            </div>
        `);

        $('#portfolio-gallery-list').append($item);
    }

    /**
     * Remove image from gallery
     */
    $(document).on('click', '.portfolio-remove-image', function(e) {
        e.preventDefault();

        const $item = $(this).closest('.portfolio-gallery-item');
        const id = $item.data('attachment-id');

        $item.fadeOut(200, function() {
            $(this).remove();

            const currentIds = $('#portfolio_project_gallery').val().split(',').filter(Boolean);
            const index = currentIds.indexOf(id.toString());
            if (index > -1) {
                currentIds.splice(index, 1);
            }
            $('#portfolio_project_gallery').val(currentIds.join(','));
        });
    });

    /**
     * Make gallery sortable (optional - requires jQuery UI)
     */
    if ($.fn.sortable) {
        $('#portfolio-gallery-list').sortable({
            items: '.portfolio-gallery-item',
            update: function() {
                const ids = [];
                $('#portfolio-gallery-list .portfolio-gallery-item').each(function() {
                    const id = $(this).data('attachment-id');
                    if (id) {
                        ids.push(id);
                    }
                });
                $('#portfolio_project_gallery').val(ids.join(','));
            }
        });
    }
});
