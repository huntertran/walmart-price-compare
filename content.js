// This script runs on walmart.ca and extracts price, unit, and calculates price per unit
class Unit {
    constructor(id, unit, regexString, scaleToStandard, standardAmount, scaleToStandardUnit) {
        this.id = id;
        this.unit = unit;
        this.regexString = regexString;
        this.scaleToStandard = scaleToStandard;
        this.standardAmount = standardAmount;
        this.scaleToStandardUnit = scaleToStandardUnit;
    }

    get Id() { return this.id; }
    get Unit() { return this.unit; }
    get RegexString() { return this.regexString; }
    get ScaleToStandard() { return this.scaleToStandard; }
    get StandardAmount() { return this.standardAmount; }
    get ScaleToStandardUnit() { return this.scaleToStandardUnit; }
}

Unit.Kilogram = new Unit(0, "kg", "kg", 10, "100g", 1000);
Unit.Milliliter = new Unit(4, "ml", "ml", 0.01, "100ml", 1);
Unit.Ounce = new Unit(3, "oz", "oz|ounce", 1, "oz", 29.5735);
Unit.Pound = new Unit(2, "lb", "lb|pound", 1, "lb", 453.592);
Unit.Count = new Unit(6, "ct", "ct|count", 1, "1ct");
Unit.Gram = new Unit(1, "g", "g", 0.01, "100g", 1);
Unit.Liter = new Unit(5, "l", "l|liters", 10, "100ml", 1000);

// unit with 2 characters must be placed at the top
Unit.All = [
    Unit.Kilogram,
    Unit.Milliliter,
    Unit.Ounce,
    Unit.Pound,
    Unit.Count,
    Unit.Gram,
    Unit.Liter
];

const regexString = (() => {
    let regexString = "\\d+(?:\\.\\d+)?\\s*(";
    for (let i = 0; i < Unit.All.length; i++) {
        regexString += Unit.All[i].RegexString + "|";
    }
    regexString = regexString.slice(0, -1);
    regexString += ")";
    return regexString;
})();

const bulkUnitRegexString = (() => {
    let regexString = "(\\d+)\\s*x\\s*(\\d+(?:\\.\\d+)?)\\s*(";
    for (let i = 0; i < Unit.All.length; i++) {
        regexString += Unit.All[i].RegexString + "|";
    }
    regexString = regexString.slice(0, -1);
    regexString += ")";
    return regexString;
})();

let preferredUnitWeight;
let preferredUnitLiquid;

function getUnit(unitText) {
    for (let i = 0; i < Unit.All.length; i++) {
        // Split RegexString by '|' to get all aliases
        const aliases = Unit.All[i].RegexString.split('|');
        if (aliases.includes(unitText)) {
            return Unit.All[i];
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

    // Bulk match count (e.g., "6 x 200 mL")
    let bulkMatch = null;
    for (let i = unitTexts.length - 1; i >= 0; i--) {
        bulkMatch = unitTexts[i].trim().match(new RegExp(bulkUnitRegexString, "i"));
        if (bulkMatch) break;
    }
    if (bulkMatch) {
        const amount = parseFloat(bulkMatch[1]);
        const multiplier = parseFloat(bulkMatch[2]);
        const unitText = bulkMatch[3].toLowerCase();
        const unit = getUnit(unitText);
        if (unit) {
            return {
                amount: amount * multiplier,
                unit: unit
            }
        }
    }

    // Match count (e.g., "12 ct") or weight (e.g., "500 g")
    let match = null;
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
            unitObj = {
                amount: walmartPricePerUnit.amount,
                unit: walmartPricePerUnit.unit
            };
            price = walmartPricePerUnit.value;
        }
    }

    // Conversion
    let preferredUnit = getPreferredUnit(unitObj);
    if (preferredUnit && preferredUnit !== unitObj.unit) {
        unitObj.amount = unitObj.amount * unitObj.unit.ScaleToStandardUnit
        unitObj.unit = preferredUnit;
        unitObj.amount = unitObj.amount / unitObj.unit.ScaleToStandardUnit
    }

    // Display on page
    let infoDiv = container.querySelector('.price-per-unit-info');
    if (!infoDiv) {
        infoDiv = document.createElement('div');
    } else {
        // Clear previous content if reusing
        infoDiv.innerHTML = '';
    }

    let usedWalmartPPU =
        walmartPricePerUnit &&
        (price / (unitObj.amount * unitObj.unit.ScaleToStandard)) > (walmartPricePerUnit.value / (walmartPricePerUnit.amount * walmartPricePerUnit.unit.ScaleToStandard));

    infoDiv.className = 'price-per-unit-info';
    infoDiv.style.background = '#ffe600';
    infoDiv.style.padding = '8px';
    infoDiv.style.fontWeight = 'bold';
    infoDiv.style.margin = '10px 0';
    infoDiv.style.borderRadius = '4px';

    // Set text content
    if (usedWalmartPPU && (preferredUnit === null || preferredUnit === undefined)) {
        infoDiv.textContent = `$${walmartPricePerUnit.value.toFixed(2)} / ${walmartPricePerUnit.unit.StandardAmount}`;
    }
    else {
        infoDiv.textContent = `$${(price / (unitObj.amount * unitObj.unit.ScaleToStandard)).toFixed(2)} / ${unitObj.unit.StandardAmount}`;
    }

    // If using Walmart price per unit, add Walmart icon
    if (usedWalmartPPU && (preferredUnit === null || preferredUnit === undefined)) {
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
        let promoPerUnit = promo.total / ((unitObj.amount * promo.qty) * unitObj.unit.ScaleToStandard);
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
        couponDiv.textContent = `$${couponPerUnit.toFixed(2)} / ${unitObj.unit.StandardAmount} | with $${couponValue} coupon`;
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

function getPreferredUnit(unitObj) {
    let preferredUnit = null;
    switch (unitObj.unit) {
        case Unit.Gram:
        case Unit.Kilogram:
        case Unit.Pound: {
            preferredUnit = preferredUnitWeight;
            break;
        }
        case Unit.Liter:
        case Unit.Milliliter:
        case Unit.Ounce: {
            preferredUnit = preferredUnitLiquid;
            break;
        }
        default: {
            preferredUnit = Unit.Count;
            break;
        }
    }

    return preferredUnit;
}

// Select all product containers (adjust selector as needed)
function processProducts(isForced = false) {
    injectUnitFilter();
    chrome.storage.sync.get(['preferredUnitLiquid', 'preferredUnitWeight'], (data) => {
        preferredUnitLiquid = getUnit(data.preferredUnitLiquid) || undefined;
        preferredUnitWeight = getUnit(data.preferredUnitWeight) || undefined;

        const productContainers = document.querySelectorAll('[data-item-id]');
        productContainers.forEach(container => {
            // Prevent duplicate infoDivs
            if (container.querySelector('.price-per-unit-info') && !isForced) return;
            const price = extractPrice(container);
            const unitObj = extractUnit(container);
            const promo = extractPromotion(container);
            const couponValue = extractCoupon(container);
            const walmartPricePerUnit = extractWalmartPricePerUnit(container)
            showPricePerUnit(container, price, unitObj, promo, couponValue, walmartPricePerUnit);
        });
    });
}

function injectUnitFilter() {
    const sortSection = document.querySelector('[aria-label="Sort and Filter section"]');
    if (!sortSection) return;

    // Check if settings icon already exists
    if (sortSection.querySelector('[data-testid="unit-settings-icon"]')) return;

    // Create settings icon button
    const settingsDiv = document.createElement('div');
    settingsDiv.className = 'flex items-center flex-shrink-0';
    settingsDiv.innerHTML = `
        <button type="button" 
                class="f6 pv2 ph2 br-pill bn bg-near-white dark-gray pointer flex items-center" 
                data-testid="unit-settings-icon"
                title="Unit Settings">
            <i class="ld ld-Gear" style="font-size:1rem;vertical-align:-0.175em;width:1rem;height:1rem;box-sizing:content-box"></i>
        </button>
        <span class="mh2">|</span>
    `;

    // Find the sort by section
    const sortBySection = sortSection.querySelector('.ml-auto');
    if (sortBySection) {
        // Insert before the "Sort by" text
        sortBySection.insertBefore(settingsDiv, sortBySection.firstChild);
    } else {
        // Fallback: append to the end of sort section
        sortSection.appendChild(settingsDiv);
    }

    // Add click handler
    settingsDiv.querySelector('button').addEventListener('click', () => {
        openUnitSettings();
    });
}

function openUnitSettings() {
    // Load CSS first
    const cssPromise = new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('/styles/popup.css');
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
    });

    // Then load HTML
    Promise.all([
        cssPromise,
        fetch(chrome.runtime.getURL('/pages/unit-selection.html')).then(r => r.text())
    ]).then(([_, html]) => {
        const modal = document.createElement('div');
        modal.className = 'price-per-unit-setting-modal-overlay';
        modal.innerHTML = `
            <div class="price-per-unit-setting-modal-content">
                <button class="price-per-unit-setting-modal-close">×</button>
                ${html}
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize select values
        const selectLiquid = modal.querySelector('#preferred-unit-liquid');
        const selectWeight = modal.querySelector('#preferred-unit-weight');

        chrome.storage.sync.get(['preferredUnitLiquid', 'preferredUnitWeight'], (data) => {
            if (data.preferredUnitLiquid) selectLiquid.value = data.preferredUnitLiquid;
            if (data.preferredUnitWeight) selectWeight.value = data.preferredUnitWeight;
        });

        // Add event listeners
        const closeModal = () => document.body.removeChild(modal);
        modal.querySelector('.price-per-unit-setting-modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        selectLiquid.addEventListener('change', () => {
            chrome.storage.sync.set({ preferredUnitLiquid: selectLiquid.value });
            processProducts(true);
        });

        selectWeight.addEventListener('change', () => {
            chrome.storage.sync.set({ preferredUnitWeight: selectWeight.value });
            processProducts(true);
        });
    }).catch(err => {
        console.error('Error loading unit settings:', err);
    });
}

// Initial run
processProducts();

// Re-run when DOM changes
const observer = new MutationObserver(() => {
    processProducts();
});
observer.observe(document.body, { childList: true, subtree: true });

// Re-run when unit preference changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'unitPreferenceChanged') {
        processProducts(true);
    }
});