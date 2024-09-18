function sendLog(message) {
    console.log(message);
    chrome.runtime.sendMessage({ type: 'log', content: message });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Usage example
const debouncedSaveQueue = debounce(saveQueue, 300);

export { sendLog, sleep, debounce };