// This script runs on walmart.ca and extracts price, unit, and calculates price per unit
function extractPrice(container) {
    // Try to find price element (common Walmart.ca selectors)
    const priceEl = container.querySelector('[data-automation-id="product-price"]>[aria-hidden="true"]');
    if (!priceEl) return null;
    const priceText = priceEl.textContent.replace(/[^\d\.]/g, '');
    return parseFloat(priceText);
}

function extractWalmartPricePerUnit(container) {
    // Try to find price per unit element (common Walmart.ca selectors)
    const pricePerUnitEl = container.querySelector('[data-testid="product-price-per-unit"]');
    if (!pricePerUnitEl) return null;
    const pricePerUnitText = pricePerUnitEl.textContent.trim();
    // Example: "11¢/100ml" or "$1.23/100g"
    let regexString = "";
    if (pricePerUnitText.includes("¢")) regexString = "([\d\.]+)\s*¢\/(\d+)([a-zA-Z]+)";
    else if (pricePerUnitText.includes("$")) regexString = "([\d\.]+)\$\s*\/(\d+)([a-zA-Z]+)";
    else return null;
    const match = pricePerUnitText.match(/([\d\.]+)\s*(¢|\$)\/(\d+)([a-zA-Z]+)/);
    if (!match) return null;
    let value = parseFloat(match[1]);
    if (match[2] === '¢') value = value / 100; // convert cents to dollars
    const amount = parseFloat(match[3]);
    const unit = match[4].toLowerCase();
    return {
        value: value,
        amount: amount,
        unit: unit,
        text: `$${value.toFixed(2)}/${amount}${unit}`
    };
}

function extractPromotion(container) {
    // Look for promotion like "2 for 8" in the badge
    const promoEl = container.querySelector('[data-testid="tag-leading-badge"]');
    if (!promoEl) return null;
    const promoText = promoEl.textContent.trim().toLowerCase();
    // Match "2 for 8", "3 for 10", etc.
    const match = promoText.match(/(\d+)\s*for\s*\$?(\d+(\.\d+)?)/i);
    if (!match) return null;
    return {
        qty: parseInt(match[1], 10),
        total: parseFloat(match[2])
    };
}

function extractUnit(container) {
    // Try to find unit (e.g., "12 ct", "500 g", etc.)
    const unitEl = container.querySelector('[data-automation-id="product-title"]');
    if (!unitEl) return null;
    let unitTexts = unitEl.textContent.toLowerCase().split(',');
    if (unitTexts.length <= 1) {
        unitTexts = unitEl.textContent.toLowerCase().split('|');
        if (unitTexts.length <= 1) {
            // No unit
            return null;
        }
    }

    // Match count (e.g., "12 ct") or weight (e.g., "500 g")
    let match = null;
    for (let i = unitTexts.length - 1; i >= 0; i--) {
        match = unitTexts[i].trim().match(/(\d+(?:\.\d+)?)\s*(ct|g|gm|kg|ml|l|oz|lb|count|pound)/i);
        if (match) break;
    }
    if (!match) return null;
    return { amount: parseFloat(match[1]), unit: match[2] };
}

function showPricePerUnit(container, price, unitObj, promo, walmartPricePerUnit) {
    if (!price || !unitObj) {
        // No price or unit
        if (!walmartPricePerUnit) {
            return;
        } else {
            price = walmartPricePerUnit.value;
            unitObj = {
                amount: walmartPricePerUnit.amount,
                unit: walmartPricePerUnit.unit
            };
        }
    }

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
    infoDiv.className = 'price-per-unit-info';
    infoDiv.textContent = perUnitText;
    infoDiv.style.background = '#ffe600';
    infoDiv.style.padding = '8px';
    infoDiv.style.fontWeight = 'bold';
    infoDiv.style.margin = '10px 0';
    infoDiv.style.borderRadius = '4px';

    // Promotion price per unit
    if (promo) {
        let promoPerUnit, promoPerUnitText;
        if (unitObj.unit === "g") {
            promoPerUnit = promo.total / ((unitObj.amount * promo.qty) / 100);
            promoPerUnitText = `Buying ${promo.qty}: Price per 100g: $${promoPerUnit.toFixed(2)}`;
        } else if (unitObj.unit === "ml") {
            promoPerUnit = promo.total / ((unitObj.amount * promo.qty) / 100);
            promoPerUnitText = `Buying ${promo.qty}: Price per 100ml: $${promoPerUnit.toFixed(2)}`;
        } else if (unitObj.unit === "l") {
            promoPerUnit = promo.total / ((unitObj.amount * promo.qty) * 10);
            promoPerUnitText = `Buying ${promo.qty}: Price per 100ml: $${promoPerUnit.toFixed(2)}`;
        } else {
            promoPerUnit = promo.total / (unitObj.amount * promo.qty);
            promoPerUnitText = `Buying ${promo.qty}: Price per ${unitObj.unit}: $${promoPerUnit.toFixed(2)}`;
        }
        let promoDiv = document.createElement('div');
        promoDiv.className = 'price-per-unit-info-promo';
        promoDiv.textContent = promoPerUnitText;
        promoDiv.style.background = '#c6ffb3';
        promoDiv.style.padding = '8px';
        promoDiv.style.fontWeight = 'bold';
        promoDiv.style.margin = '5px 0 10px 0';
        promoDiv.style.borderRadius = '4px';
        infoDiv.appendChild(promoDiv);
    }

    // Insert after price
    const priceEl = container.querySelector('[data-automation-id="product-price"]');
    if (priceEl && priceEl.parentNode) {
        priceEl.parentNode.insertBefore(infoDiv, priceEl.nextSibling);
    } else {
        container.body.prepend(infoDiv);
    }
}

// Select all product containers (adjust selector as needed)
function processProducts() {
    const productContainers = document.querySelectorAll('[data-item-id]');
    productContainers.forEach(container => {
        // Prevent duplicate infoDivs
        if (container.querySelector('.price-per-unit-info')) return;
        const price = extractPrice(container);
        const unitObj = extractUnit(container);
        const promo = extractPromotion(container);
        const walmartPricePerUnit = extractWalmartPricePerUnit(container)
        showPricePerUnit(container, price, unitObj, promo, walmartPricePerUnit);
    });
}

// Initial run
processProducts();

// Re-run when DOM changes
const observer = new MutationObserver(() => {
    processProducts();
});
observer.observe(document.body, { childList: true, subtree: true });
