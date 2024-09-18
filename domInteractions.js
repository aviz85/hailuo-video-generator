import { sendLog, sleep } from './utils.js';

async function simulateTyping(element, text) {
    for (let char of text) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        const keyEvent = new KeyboardEvent('keydown', { key: char, bubbles: true });
        element.dispatchEvent(keyEvent);
        element.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        
        await sleep(Math.random() * 100 + 50);
    }
}

async function clearTextArea(element) {
    const originalValue = element.value;
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    for (let i = 0; i < originalValue.length; i++) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', bubbles: true }));
        await sleep(Math.random() * 50 + 30);
    }
    
    if (!element.isConnected) {
        sendLog("Text area became inaccessible after clearing");
        throw new Error("Text area is no longer accessible");
    }
}

function checkLoadingAnimation() {
    return document.querySelector('.rotate-image') !== null;
}

async function waitForAnimation(shouldAppear) {
    await sleep(60000); // Wait for 1 minute before first check
    
    while (checkLoadingAnimation() !== shouldAppear) {
        await sleep(5000); // Check every 5 seconds
    }
}

export { simulateTyping, clearTextArea, checkLoadingAnimation, waitForAnimation };
