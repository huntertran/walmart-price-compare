// This script runs on walmart.ca and extracts price, unit, and calculates price per unit
(function () {
    function extractPrice(container) {
        // Try to find price element (common Walmart.ca selectors)
        const priceEl = container.querySelector('[data-automation-id="product-price"]>[aria-hidden="true"]');
        if (!priceEl) return null;
        const priceText = priceEl.textContent.replace(/[^\d\.]/g, '');
        return parseFloat(priceText);
    }

    function extractUnit(container) {
        // Try to find unit (e.g., "12 ct", "500 g", etc.)
        const unitEl = container.querySelector('[data-automation-id="product-title"]');
        if (!unitEl) return null;
        const unitText = unitEl.textContent.toLowerCase().split(',')[1].trim();
        // Match count (e.g., "12 ct") or weight (e.g., "500 g")
        const match = unitText.match(/(\d+(?:\.\d+)?)\s*(ct|g|kg|ml|l|oz|lb|count|pound)/i);
        if (!match) return null;
        return { amount: parseFloat(match[1]), unit: match[2] };
    }

    function showPricePerUnit(container, price, unitObj) {
        if (!price || !unitObj) return;
        let perUnit, perUnitText;
        if (unitObj.unit === "g") {
            perUnit = price / (unitObj.amount / 100);
            perUnitText = `Price per 100g: $${perUnit.toFixed(2)}`;
        } else if (unitObj.unit === "ml") {
            perUnit = price / (unitObj.amount / 100);
            perUnitText = `Price per 100ml: $${perUnit.toFixed(2)}`;
        } else if (unitObj.unit === "l") {
            perUnit = price / (unitObj.amount * 10); // 1L = 1000ml, so 1L = 10 x 100ml
            perUnitText = `Price per 100ml: $${perUnit.toFixed(2)}`;
        } else {
            perUnit = price / unitObj.amount;
            perUnitText = `Price per ${unitObj.unit}: $${perUnit.toFixed(2)}`;
        }
        // Display on page
        let infoDiv = document.createElement('div');
        infoDiv.textContent = perUnitText;
        infoDiv.style.background = '#ffe600';
        infoDiv.style.padding = '8px';
        infoDiv.style.fontWeight = 'bold';
        infoDiv.style.margin = '10px 0';
        infoDiv.style.borderRadius = '4px';
        // Insert after price
        const priceEl = container.querySelector('[data-automation-id="product-price"]');
        if (priceEl && priceEl.parentNode) {
            priceEl.parentNode.insertBefore(infoDiv, priceEl.nextSibling);
        } else {
            container.body.prepend(infoDiv);
        }
    }

    // Select all product containers (adjust selector as needed)
    const productContainers = document.querySelectorAll('[data-item-id]');
    productContainers.forEach(container => {
        const price = extractPrice(container);
        const unitObj = extractUnit(container);
        showPricePerUnit(container, price, unitObj);
    });
})();
