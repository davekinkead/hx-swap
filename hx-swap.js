/**
 * HX-SWAP Extension for HTMX
 * Adds a new swap mechanism: hx-swap="ids"
 * Replaces DOM elements based on matching ID attributes
 */
(function() {

    function performIdsSwap(target, responseHTML) {
        // Parse the fragment as HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(responseHTML, 'text/html');

        // Get all elements with IDs from the response
        const responseElements = doc.querySelectorAll('[id]');

        // Track which IDs we've seen to filter to outermost only
        const idSet = new Set();
        responseElements.forEach(el => idSet.add(el.id));

        // Filter to outermost elements only
        const outermostElements = Array.from(responseElements).filter(element => {
            // Check if any ancestor has an ID that's in our set
            let parent = element.parentElement;
            while (parent && parent !== doc.body && parent !== doc.documentElement) {
                if (parent.id && idSet.has(parent.id)) {
                    return false; // This is nested
                }
                parent = parent.parentElement;
            }
            return true; // This is outermost
        });

        // Replace each matching element in the current DOM
        outermostElements.forEach(newElement => {
            const id = newElement.id;
            // Find all elements with this ID in the current DOM
            const currentElements = document.querySelectorAll(`#${CSS.escape(id)}`);

            currentElements.forEach(currentElement => {
                // Clone the new element and replace the current one
                const clone = newElement.cloneNode(true);
                currentElement.replaceWith(clone);

                // Process HTMX attributes on the new element
                htmx.process(clone);
            });
        });
    }

    // Define the extension
    htmx.defineExtension('ids', {
        onEvent: function(name, evt) {
            // Intercept the beforeSwap event
            if (name === 'htmx:beforeSwap') {
                const target = evt.detail.target;
                const swapSpec = evt.detail.swapSpec || target.getAttribute('hx-swap');

                // Check if this is our custom swap style
                if (swapSpec === 'ids') {
                    // Prevent default swap behavior
                    evt.preventDefault();

                    // Get the response HTML
                    const responseHTML = evt.detail.xhr ? evt.detail.xhr.responseText : evt.detail.serverResponse;

                    if (responseHTML) {
                        // Perform our custom swap
                        performIdsSwap(target, responseHTML);
                    }

                    // Mark as handled
                    return false;
                }
            }
            return true;
        }
    });

})();
