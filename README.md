# Walmart Price Per Unit Chrome Extension

This extension works on walmart.ca product pages, extracts the item price and unit (like "12 ct"), and displays the price per unit directly on the page.

## How to use
1. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder.
2. Visit a product page on walmart.ca.
3. The price per unit will appear below the price.

## Files
- `manifest.json`: Extension manifest
- `content.js`: Content script for extracting and displaying price per unit
- `popup.html`: Popup UI
- `background.js`: Background script
- `icon16.png`, `icon48.png`, `icon128.png`: Extension icons (replace with your own)

## Notes
- The extension uses common selectors for price and unit. If Walmart.ca changes their layout, selectors may need updating.
