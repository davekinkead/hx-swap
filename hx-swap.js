/**
 * HX-SWAP Extension for HTMX
 * Adds a new swap mechanism: hx-swap="ids"
 * Replaces DOM elements based on matching ID attributes
 */
(function() {
    htmx.defineExtension('ids', {
        /**
         * Handles swap events to implement custom 'ids' swap strategy
         */
        handleSwap: function(swapStyle, target, fragment, settleInfo) {
            if (swapStyle !== 'ids') {
                return false; // Not our swap style, let HTMX handle it
            }

            // Create a temporary container to parse the response HTML
            const temp = document.createElement('div');
            temp.innerHTML = fragment;

            // Find all elements with IDs in the response
            const elementsWithIds = temp.querySelectorAll('[id]');

            // Build a map of IDs to elements, filtering to outermost only
            const idMap = new Map();
            const processedIds = new Set();

            elementsWithIds.forEach(element => {
                const id = element.id;

                // Check if this element is nested within another element with an ID
                // that we've already seen in this response
                let isNested = false;
                let parent = element.parentElement;

                while (parent && parent !== temp) {
                    if (parent.id && processedIds.has(parent.id)) {
                        isNested = true;
                        break;
                    }
                    parent = parent.parentElement;
                }

                if (!isNested) {
                    processedIds.add(id);
                    if (!idMap.has(id)) {
                        idMap.set(id, []);
                    }
                    idMap.get(id).push(element);
                }
            });

            // Replace matching elements in the DOM
            let swapCount = 0;
            idMap.forEach((elements, id) => {
                // Find all elements in the current DOM with this ID
                const targets = document.querySelectorAll(`#${CSS.escape(id)}`);

                targets.forEach(domElement => {
                    // Use the first matching element from response
                    const newElement = elements[0];

                    if (newElement) {
                        // Replace the element (outerHTML by default)
                        domElement.replaceWith(newElement.cloneNode(true));
                        swapCount++;
                    }
                });
            });

            // Return true to indicate we handled the swap
            return true;
        }
    });

    // Also register as a swap modifier for more idiomatic usage
    htmx.defineExtension('hx-swap-ids', {
        transformResponse: function(text, xhr, elt) {
            return text;
        },

        handleSwap: function(swapStyle, target, fragment, settleInfo) {
            if (swapStyle !== 'ids') {
                return false;
            }

            // Parse the fragment as HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(fragment, 'text/html');

            // Get all elements with IDs from the response
            const responseElements = doc.querySelectorAll('[id]');

            // Track which IDs we've seen to filter to outermost only
            const idSet = new Set();
            responseElements.forEach(el => idSet.add(el.id));

            // Filter to outermost elements only
            const outermostElements = Array.from(responseElements).filter(element => {
                // Check if any ancestor has an ID that's in our set
                let parent = element.parentElement;
                while (parent && parent !== doc.body) {
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

            // Return true to indicate we handled the swap
            return true;
        }
    });
})();
