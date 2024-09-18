let intervalId;
let countdown;
let isFirstCheck = true;

chrome.runtime.onInstalled.addListener(() => {
    console.log('Hailuo Video Generator Extension installed.');
    chrome.storage.local.set({ logs: [], status: 'Idle', prompts: [], countdown: null });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received message:", request.action);
    if (request.action === 'startProcess') {
        console.log("Starting process");
        isFirstCheck = true;
        startCountdown(5); // Changed to 5 seconds for faster debugging
    } else if (request.action === 'stopProcess') {
        console.log("Stopping process");
        stopCountdown();
    } else if (request.action === 'getCountdown') {
        sendResponse({ countdown: countdown });
    }
    return true;
});

function startCountdown(seconds) {
    countdown = seconds;
    clearInterval(intervalId);
    intervalId = setInterval(() => {
        countdown--;
        chrome.storage.local.set({ countdown: countdown });
        if (countdown <= 0) {
            console.log("Countdown reached zero, checking and running prompts");
            checkAndRunPrompts();
            if (isFirstCheck) {
                isFirstCheck = false;
                startCountdown(5);
            } else {
                countdown = 5;
            }
        }
    }, 1000);
}

function stopCountdown() {
    clearInterval(intervalId);
    countdown = null;
    chrome.storage.local.set({ countdown: null, status: 'Idle' });
}

function checkAndRunPrompts() {
    console.log("Checking for hailuoai.com/video tabs");
    chrome.tabs.query({url: 'https://hailuoai.com/video*'}, (tabs) => {
        if (tabs.length > 0) {
            console.log("Found hailuoai.com/video tab, sending runPrompts message");
            chrome.tabs.sendMessage(tabs[0].id, {action: 'runPrompts'});
        } else {
            console.log("No hailuoai.com/video tab found");
        }
    });
}

function startProcess() {
    isFirstCheck = true;
    startCountdown(60);
}

function stopProcess() {
    stopCountdown();
}