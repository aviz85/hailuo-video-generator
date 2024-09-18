let intervalId;
let countdown;
let isFirstCheck = true;
let tabId = null;

chrome.runtime.onInstalled.addListener(() => {
    console.log('Hailuo Video Generator Extension installed.');
    chrome.storage.local.set({ logs: [], status: 'Idle', prompts: [], countdown: null });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received message:", request.action);
    if (request.action === 'startProcess') {
        console.log("Starting process");
        isFirstCheck = true;
        startCountdown(60); // Start with 60 seconds for the first check
    } else if (request.action === 'stopProcess') {
        console.log("Stopping process");
        stopCountdown();
    } else if (request.action === 'getCountdown') {
        sendResponse({ countdown: countdown });
    } else if (request.action === 'contentScriptReady') {
        tabId = sender.tab.id;
        console.log("Content script ready in tab:", tabId);
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
    if (tabId) {
        console.log("Sending runPrompts message to tab:", tabId);
        chrome.tabs.sendMessage(tabId, {action: 'runPrompts'}, response => {
            if (chrome.runtime.lastError) {
                console.log("Error sending message:", chrome.runtime.lastError.message);
                tabId = null; // Reset tabId if there's an error
            } else {
                console.log("Message sent successfully");
            }
        });
    } else {
        console.log("No tab ID available, searching for hailuoai.com/video tab");
        chrome.tabs.query({url: ['https://hailuoai.com/video*', 'https://hailuo.ai/video*']}, (tabs) => {
            if (tabs.length > 0) {
                tabId = tabs[0].id;
                console.log("Found hailuoai.com/video tab, sending runPrompts message");
                chrome.tabs.sendMessage(tabId, {action: 'runPrompts'}, response => {
                    if (chrome.runtime.lastError) {
                        console.log("Error sending message:", chrome.runtime.lastError.message);
                        tabId = null; // Reset tabId if there's an error
                    } else {
                        console.log("Message sent successfully");
                    }
                });
            } else {
                console.log("No hailuoai.com/video tab found");
            }
        });
    }
}

// Function to start the process
function startProcess() {
    isFirstCheck = true;
    startCountdown(60);
}

// Function to stop the process
function stopProcess() {
    stopCountdown();
}

// Export functions if needed
export { startProcess, stopProcess };