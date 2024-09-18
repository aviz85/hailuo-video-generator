import { sendLog, sleep } from './utils.js';
import { simulateTyping, clearTextArea, waitForAnimation } from './domInteractions.js';
import { getFromStorage, setInStorage } from './storage.js';

let currentPrompt = null;
let remainingRepeats = 0;
let isWaitingForAnimation = false;

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
        await clearTextArea(textArea);
        await sleep(300);
        
        sendLog(`Typing prompt: "${prompt.text}"`);
        await simulateTyping(textArea, prompt.text);
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
        await waitForAnimation(true);
        sendLog("Waiting for animation to end");
        await waitForAnimation(false);
        isWaitingForAnimation = false;
        
        sendLog(`Completed processing for prompt: "${prompt.text}"`);
    } catch (error) {
        sendLog(`Error executing prompt: ${error.message}`);
    }
}

async function executePrompts() {
    sendLog("Starting executePrompts function");
    const promptQueue = await getFromStorage('promptQueue');
    sendLog(`Retrieved promptQueue: ${JSON.stringify(promptQueue)}`);
    
    for (const prompt of promptQueue) {
        sendLog(`Processing prompt: ${JSON.stringify(prompt)}`);
        for (let i = 0; i < prompt.repeats; i++) {
            sendLog(`Repeat ${i + 1} of ${prompt.repeats}`);
            await executePrompt(prompt);
            sendLog("Waiting 1 second before next execution");
            await sleep(1000);
        }
    }
    sendLog("Finished processing all prompts");
}

async function checkAndGenerateVideo() {
    sendLog("Starting checkAndGenerateVideo function");
    if (isWaitingForAnimation) {
        sendLog("Still waiting for animation, skipping this check");
        return;
    }

    const [promptQueue, isRunning] = await Promise.all([
        getFromStorage('promptQueue'),
        getFromStorage('isRunning')
    ]);

    sendLog(`Current state - isRunning: ${isRunning}, promptQueue length: ${promptQueue ? promptQueue.length : 0}`);

    if (isRunning && promptQueue && promptQueue.length > 0) {
        if (currentPrompt === null) {
            currentPrompt = promptQueue[0];
            remainingRepeats = currentPrompt.repeats;
            sendLog(`Starting new prompt: "${currentPrompt.text}", repeats: ${remainingRepeats}`);
            await executePrompt(currentPrompt);
            remainingRepeats--;

            if (remainingRepeats <= 0) {
                sendLog("Finished all repeats for current prompt, moving to next");
                const newQueue = promptQueue.slice(1);
                await setInStorage('promptQueue', newQueue);
                currentPrompt = null;
            } else {
                sendLog(`Remaining repeats for current prompt: ${remainingRepeats}`);
            }
        } else {
            sendLog("Current prompt still being processed");
        }
    } else if (isRunning && (!promptQueue || promptQueue.length === 0)) {
        sendLog('No more prompts in queue, setting isRunning to false');
        await setInStorage('isRunning', false);
        sendLog('Finished processing all prompts');
    } else {
        sendLog('Not running or no prompts in queue');
    }
}

sendLog("Content script loaded, setting up interval");
setInterval(checkAndGenerateVideo, 5000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendLog(`Received message: ${JSON.stringify(request)}`);
    if (request.action === 'runPrompts') {
        sendLog("Received runPrompts message, starting execution");
        executePrompts();
    }
});

sendLog("Content script fully initialized and running");