# Walmart Price Per Unit Chrome Extension

This extension works on walmart.ca product pages, extracts the item price and unit (like "12 ct"), and displays the price per unit directly on the page.

| Browser   | Install from ... |
| :-------: | ---------------- |
| <img src="https://github.com/user-attachments/assets/3a7569f8-688b-4eb1-a643-8d0fe173aefe" alt="Get Walmart Price per Unit for Microsoft Edge"> | <a href="https://microsoftedge.microsoft.com/addons/detail/walmart-price-per-unit/digjbmmdgmpmnfbiophhcifkhpmhpacc">Edge Add-ons</a> |
| <img src="https://github.com/user-attachments/assets/b0136512-56a5-4856-8c50-4971c957a24f" alt="Get Walmart Price per Unit for Firefox"> | <a href="">Firefox Add-ons</a> |
| <img src="https://github.com/user-attachments/assets/5463ef88-873b-4516-8514-5277664cfde7" alt="Get Walmart Price per Unit for Chromium"> | <a href="">Chrome Web Store</a> |

## Developments
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

## Tests

To test the extension, go to walmart.ca site, search for a product (for example, "eggs"), and the price per unit should appear under each item in the search result.

You can also search for keywords like `coupon` for item with coupon, or `roll back` for weekly discounted items

## Notes
- The extension uses common selectors for price and unit. If Walmart.ca changes their layout, selectors may need updating.
