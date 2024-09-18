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

export async function waitForAnimation(shouldAppear) {
    console.log(`Waiting for animation to ${shouldAppear ? 'appear' : 'disappear'}`);
    let startTime = Date.now();
    const maxWaitTime = 300000; // 5 minutes

    while (checkLoadingAnimation() !== shouldAppear) {
        if (Date.now() - startTime > maxWaitTime) {
            console.log(`Animation wait timed out after ${maxWaitTime / 1000} seconds`);
            return false;
        }
        await sleep(5000); // Check every 5 seconds
    }
    
    console.log(`Animation ${shouldAppear ? 'appeared' : 'disappeared'}`);
    return true;
}

export function checkLoadingAnimation() {
    const animationElement = document.querySelector('.rotate-image');
    console.log(`Animation element present: ${animationElement !== null}`);
    return animationElement !== null;
}

export { simulateTyping, clearTextArea, checkLoadingAnimation, waitForAnimation };
