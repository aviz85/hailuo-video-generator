import { sendLog } from './utils.js';

export function getFromStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(key, (result) => {
            if (chrome.runtime.lastError) {
                sendLog(`Error getting ${key} from storage: ${chrome.runtime.lastError.message}`);
                resolve(null);
            } else {
                resolve(result[key]);
            }
        });
    });
}

export function setInStorage(key, value) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                sendLog(`Error setting ${key} in storage: ${chrome.runtime.lastError.message}`);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}