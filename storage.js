import { sendLog } from './utils.js';

// Use local storage for frequently changing data
const setLocalData = (key, value) => chrome.storage.local.set({ [key]: value });
const getLocalData = (key) => chrome.storage.local.get(key);

// Use sync storage for user preferences and queue
const setSyncData = (key, value) => chrome.storage.sync.set({ [key]: value });
const getSyncData = (key) => chrome.storage.sync.get(key);

function getFromStorage(key) {
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

function setInStorage(key, value) {
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

export { getFromStorage, setInStorage };