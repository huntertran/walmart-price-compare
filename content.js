// This script runs on walmart.ca and extracts price, unit, and calculates price per unit
class Unit {
    constructor(unit, regexString, scaleToStandard, standardAmount) {
        this.unit = unit;
        this.regexString = regexString;
        this.scaleToStandard = scaleToStandard;
        this.standardAmount = standardAmount;
    }

    get Unit() { return this.unit; }
    get RegexString() { return this.regexString; }
    get ScaleToStandard() { return this.scaleToStandard; }
    get StandardAmount() { return this.standardAmount; }
}

Unit.Gram = new Unit("g", "g", 100, "100g");
Unit.Kilogram = new Unit("kg", "kg", 10, "100g");
Unit.Milliliter = new Unit("ml", "ml", 100, "100ml");
Unit.Liter = new Unit("l", "l", 10, "100ml");
Unit.Ounce = new Unit("oz", "oz|ounce", 28.3495, "1oz");
Unit.Pound = new Unit("lb", "lb|pound", 453.592, "1lb");
Unit.Count = new Unit("ct", "ct|count", 1, "1ct");

Unit.All = [
    Unit.Gram,
    Unit.Kilogram,
    Unit.Milliliter,
    Unit.Liter,
    Unit.Ounce,
    Unit.Pound,
    Unit.Count
];

function getUnit(unitText) {
    for (let i = 0; i < Unit.All.length; i++) {
        if (Unit.All[i].Unit === unitText) {
            return Unit.All[i]
        }
    }

    return null;
}

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
    const match = pricePerUnitText.match(/([\d\.]+)\s*(¢|\$)\/(\d+)([a-zA-Z]+)/);
    if (!match) return null;
    let value = parseFloat(match[1]);
    if (match[2] === '¢') value = value / 100; // convert cents to dollars
    const amount = parseFloat(match[3]);
    const unit = match[4].toLowerCase();
    return {
        value: value,
        amount: amount,
        unit: getUnit(unit),
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

function extractCoupon(container) {
    // Look for coupon like "$2 coupon" in the banner
    const couponEl = container.querySelector('[data-testid="product-promo-banner"]');
    if (!couponEl) return null;
    const couponText = couponEl.textContent.trim().toLowerCase();
    // Match "$2 coupon", "$1.50 coupon", etc.
    const match = couponText.match(/\$([\d\.]+)\s*coupon/i);
    if (!match) return null;
    return parseFloat(match[1]);
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
    let regexString = "\\d+(?:\\.\\d+)?\\s*(";
    for (let i = 0; i < Unit.All.length; i++) {
        regexString += Unit.All[i].RegexString + "|";
    }
    regexString = regexString.slice(0, -1);
    regexString += ")";
    for (let i = unitTexts.length - 1; i >= 0; i--) {
        match = unitTexts[i].trim().match(new RegExp(regexString, "i"));
        if (match) break;
    }
    if (!match) return null;
    if (match.length < 2) return null;
    let amount = parseFloat(match[0]);
    let unitText = match[1].toLowerCase();

    let unit = getUnit(unitText);
    if (unit) {
        return {
            amount: amount,
            unit: unit
        }
    }

    return null;
}

function showPricePerUnit(container, price, unitObj, promo, couponValue, walmartPricePerUnit) {
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

    // Display on page
    let infoDiv = document.createElement('div');

    let usedWalmartPPU = false;
    if (
        walmartPricePerUnit &&
        (price / (unitObj.amount / unitObj.unit.ScaleToStandard)) > (walmartPricePerUnit.value / (walmartPricePerUnit.amount / walmartPricePerUnit.unit.ScaleToStandard))
    ) {
        // Use Walmart price per unit
        price = walmartPricePerUnit.value;
        unitObj = {
            amount: walmartPricePerUnit.amount,
            unit: walmartPricePerUnit.unit
        };
        usedWalmartPPU = true;
    }

    infoDiv.className = 'price-per-unit-info';
    infoDiv.style.background = '#ffe600';
    infoDiv.style.padding = '8px';
    infoDiv.style.fontWeight = 'bold';
    infoDiv.style.margin = '10px 0';
    infoDiv.style.borderRadius = '4px';

    // Set text content
    infoDiv.textContent = `$${(price / (unitObj.amount / unitObj.unit.ScaleToStandard)).toFixed(2)} / ${unitObj.unit.StandardAmount}`;

    // If using Walmart price per unit, add Walmart icon
    if (usedWalmartPPU) {
        const icon = document.createElement('img');
        icon.classList.add('ppu-walmart-icon');
        icon.src = 'https://www.walmart.ca/favicon.ico';
        icon.alt = 'Walmart';
        icon.style.width = '18px';
        icon.style.height = '18px';
        icon.style.verticalAlign = 'middle';
        icon.style.marginLeft = '6px';
        infoDiv.appendChild(icon);
    }

    // Promotion price per unit
    if (promo) {
        let promoPerUnit = promo.total / ((unitObj.amount * promo.qty) / unitObj.unit.ScaleToStandard);
        let promoDiv = document.createElement('div');
        promoDiv.className = 'price-per-unit-info-promo';
        promoDiv.textContent = `$${promoPerUnit.toFixed(2)} / ${unitObj.unit.StandardAmount} | if buying ${promo.qty}`;
        promoDiv.style.background = '#c6ffb3';
        promoDiv.style.padding = '8px';
        promoDiv.style.fontWeight = 'bold';
        promoDiv.style.margin = '5px 0 10px 0';
        promoDiv.style.borderRadius = '4px';
        infoDiv.appendChild(promoDiv);
    }

    // Coupon price per unit
    if (couponValue) {
        let couponPrice = Math.max(price - couponValue, 0);
        let couponPerUnit = couponPrice / (unitObj.amount / unitObj.unit.ScaleToStandard);
        let couponDiv = document.createElement('div');
        couponDiv.className = 'price-per-unit-info-coupon';
        couponDiv.textContent = `Price per $${couponPerUnit.toFixed(2)} / ${unitObj.unit.StandardAmount} | with $${couponValue} coupon`;
        couponDiv.style.background = '#b3e0ff';
        couponDiv.style.padding = '8px';
        couponDiv.style.fontWeight = 'bold';
        couponDiv.style.margin = '5px 0 10px 0';
        couponDiv.style.borderRadius = '4px';
        infoDiv.appendChild(couponDiv);
    }

    // Coupon + Promotion price per unit
    if (couponValue && promo) {
        let promoCouponPrice = Math.max(promo.total - couponValue, 0);
        let promoCouponPerUnit = promoCouponPrice / ((unitObj.amount * promo.qty) / unitObj.unit.ScaleToStandard);
        let promoCouponDiv = document.createElement('div');
        promoCouponDiv.className = 'price-per-unit-info-promo-coupon';
        promoCouponDiv.textContent = `$${promoCouponPerUnit.toFixed(2)} / ${unitObj.unit.StandardAmount} | With $${couponValue} coupon & buying ${promo.qty}`;
        promoCouponDiv.style.background = '#ffe0b3';
        promoCouponDiv.style.padding = '8px';
        promoCouponDiv.style.fontWeight = 'bold';
        promoCouponDiv.style.margin = '5px 0 10px 0';
        promoCouponDiv.style.borderRadius = '4px';
        infoDiv.appendChild(promoCouponDiv);
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
        const couponValue = extractCoupon(container);
        const walmartPricePerUnit = extractWalmartPricePerUnit(container)
        showPricePerUnit(container, price, unitObj, promo, couponValue, walmartPricePerUnit);
    });
}

// Initial run
processProducts();

// Re-run when DOM changes
const observer = new MutationObserver(() => {
    processProducts();
});
observer.observe(document.body, { childList: true, subtree: true });