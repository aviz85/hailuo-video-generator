import { sendLog, sleep, debounce } from './utils.js';
import * as domInteractions from './domInteractions.js';
import * as storage from './storage.js';

let currentPrompt = null;
let remainingRepeats = 0;
let isWaitingForAnimation = false;
let isRunning = false; // Initialize at the top of the file

function sendReadyMessage() {
    chrome.runtime.sendMessage({action: 'contentScriptReady'}, response => {
        if (chrome.runtime.lastError) {
            console.log("Error sending contentScriptReady message:", chrome.runtime.lastError.message);
            // Try again after a short delay
            setTimeout(sendReadyMessage, 1000);
        } else {
            console.log("contentScriptReady message sent successfully");
        }
    });
}

async function executePrompt(prompt) {
    sendLog(`Starting execution of prompt: "${prompt.text}"`);
    const textArea = document.querySelector('textarea[placeholder^="请描述想生成的视频内容"]');
    const buildButton = document.querySelector('button.build_video');
    
    if (!textArea || !buildButton) {
        sendLog("Could not find textarea or button");
        return;
    }

    sendLog("Found textarea and button");
    textArea.focus();
    textArea.dispatchEvent(new Event('focus', { bubbles: true }));
    
    try {
        sendLog("Clearing textarea");
        await domInteractions.clearTextArea(textArea);
        await sleep(300);
        
        sendLog(`Typing prompt: "${prompt.text}"`);
        await domInteractions.simulateTyping(textArea, prompt.text);
        await sleep(500);
        
        sendLog("Verifying typed text");
        if (textArea.value !== prompt.text) {
            sendLog(`Warning: Typed text "${textArea.value}" doesn't match prompt "${prompt.text}"`);
        }
        
        sendLog("Clicking build button");
        buildButton.click();
        sendLog(`Executed prompt: "${prompt.text}"`);
        
        isWaitingForAnimation = true;
        sendLog("Waiting for animation to start");
        let animationStarted = await domInteractions.waitForAnimation(true);
        if (!animationStarted) {
            sendLog("Animation did not start within the expected time");
            isWaitingForAnimation = false;
            return;
        }
        
        sendLog("Waiting for animation to end");
        let animationEnded = await domInteractions.waitForAnimation(false);
        if (!animationEnded) {
            sendLog("Animation did not end within the expected time");
        }
        
        isWaitingForAnimation = false;
        sendLog(`Completed processing for prompt: "${prompt.text}"`);
    } catch (error) {
        sendLog(`Error executing prompt: ${error.message}`);
        isWaitingForAnimation = false;
    }
}

async function executePrompts() {
    sendLog("Starting executePrompts function");
    const promptQueue = await storage.getFromStorage('promptQueue');
    sendLog(`Retrieved promptQueue: ${JSON.stringify(promptQueue)}`);
    
    if (promptQueue && promptQueue.length > 0) {
        for (const prompt of promptQueue) {
            sendLog(`Processing prompt: ${JSON.stringify(prompt)}`);
            for (let i = 0; i < prompt.repeats; i++) {
                sendLog(`Repeat ${i + 1} of ${prompt.repeats}`);
                await executePrompt(prompt);
                sendLog("Waiting 5 seconds before next execution");
                await sleep(5000);
            }
        }
        sendLog("Finished processing all prompts");
        await storage.setInStorage('promptQueue', []);
        await storage.setInStorage('isRunning', false);
    } else {
        sendLog("No prompts in queue");
    }
}

async function checkAndGenerateVideo() {
    sendLog("Starting checkAndGenerateVideo function");
    if (isWaitingForAnimation) {
        sendLog("Still waiting for animation, skipping this check");
        return;
    }

    const promptQueue = await storage.getFromStorage('promptQueue');
    sendLog(`Current state - isRunning: ${isRunning}, promptQueue length: ${promptQueue ? promptQueue.length : 0}`);

    if (!isRunning && promptQueue && promptQueue.length > 0) {
        sendLog("Starting to process prompts");
        isRunning = true;
        await storage.setInStorage('isRunning', true);
        await executePrompts();
    } else if (isRunning && (!promptQueue || promptQueue.length === 0)) {
        sendLog('No more prompts in queue, setting isRunning to false');
        isRunning = false;
        await storage.setInStorage('isRunning', false);
        sendLog('Finished processing all prompts');
    } else if (isRunning) {
        sendLog('Already running, skipping this check');
    } else {
        sendLog('Not running and no prompts in queue');
    }
}

function main() {
    console.log("Content script loaded");

    // Send the ready message when the script loads
    sendReadyMessage();

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        sendLog(`Received message: ${JSON.stringify(request)}`);
        if (request.action === 'runPrompts') {
            sendLog("Received runPrompts message, starting execution");
            executePrompts();
        }
        return true;
    });

    // Re-send the ready message periodically in case the background script reloads
    setInterval(sendReadyMessage, 60000); // Every minute

    // Set up interval for checking and generating videos
    setInterval(checkAndGenerateVideo, 5000);

    sendLog("Content script fully initialized and running");
}

export { main };