export function sendLog(message) {
    console.log(message);
    chrome.runtime.sendMessage({ type: 'log', content: message });
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce(func, wait) {
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