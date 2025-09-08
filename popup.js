document.addEventListener('DOMContentLoaded', () => {
    const selectLiquid = document.getElementById('preferred-unit-liquid');
    chrome.storage.sync.get('preferredUnitLiquid', (data) => {
        if (data.preferredUnitLiquid) {
            selectLiquid.value = data.preferredUnitLiquid;
        }
        else {
            selectLiquid.value = '';
        }
    });
    selectLiquid.addEventListener('change', () => {
        chrome.storage.sync.set({ preferredUnitLiquid: selectLiquid.value });
    });

    const selectWeight = document.getElementById('preferred-unit-weight');
    chrome.storage.sync.get('preferredUnitWeight', (data) => {
        if (data.preferredUnitWeight) {
            selectWeight.value = data.preferredUnitWeight;
        }
        else {
            selectLiquid.value = '';
        }
    });
    selectWeight.addEventListener('change', () => {
        chrome.storage.sync.set({ preferredUnitWeight: selectWeight.value });
    });
});