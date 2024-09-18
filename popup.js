let promptQueue = [];
const MAX_LOGS = 100;
let countdownInterval;

function updatePromptList() {
    const promptList = document.getElementById('promptList');
    if (!promptList) return;
    
    promptList.innerHTML = '';
    promptQueue.forEach((prompt, index) => {
        const promptElement = document.createElement('div');
        promptElement.className = 'promptItem';
        promptElement.innerHTML = `
            <span>${index + 1}. "${prompt.text}" (${prompt.repeats} times)</span>
            <span class="deleteButton" data-index="${index}">X</span>
        `;
        promptList.appendChild(promptElement);
    });

    document.querySelectorAll('.deleteButton').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            promptQueue.splice(index, 1);
            updatePromptList();
            saveQueue();
            addLog(`Removed prompt at index ${index}`);
        });
    });
}

function saveQueue() {
    chrome.storage.sync.set({ promptQueue }, () => {
        console.log('Queue saved:', promptQueue);
        addLog('Queue saved to storage');
    });
}

function loadQueue() {
    chrome.storage.sync.get('promptQueue', (data) => {
        if (data.promptQueue) {
            promptQueue = data.promptQueue;
            updatePromptList();
            console.log('Queue loaded:', promptQueue);
            addLog('Queue loaded from storage');
        }
    });
}

function updateCountdown() {
    chrome.runtime.sendMessage({action: 'getCountdown'}, (response) => {
        const countdownElement = document.getElementById('countdown');
        if (countdownElement && response && response.countdown !== null) {
            countdownElement.textContent = `Next check in: ${response.countdown}s`;
            countdownElement.style.display = 'block';
        } else if (countdownElement) {
            countdownElement.style.display = 'none';
        }
    });
}

function updateButtonState(isRunning) {
    const startQueueButton = document.getElementById('startQueue');
    const cancelProcessButton = document.getElementById('cancelProcess');
    const statusElement = document.getElementById('status');
    const countdownElement = document.getElementById('countdown');

    if (startQueueButton) startQueueButton.style.display = isRunning ? 'none' : 'block';
    if (cancelProcessButton) cancelProcessButton.style.display = isRunning ? 'block' : 'none';
    if (statusElement) statusElement.textContent = isRunning ? 'Running' : 'Idle';
    
    chrome.storage.local.set({ status: isRunning ? 'Running' : 'Idle' });

    if (isRunning) {
        countdownInterval = setInterval(updateCountdown, 1000);
    } else {
        clearInterval(countdownInterval);
        if (countdownElement) countdownElement.style.display = 'none';
    }
}

function addLog(message) {
    const logSection = document.getElementById('logSection');
    if (!logSection) return;

    const logEntry = document.createElement('p');
    logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logSection.appendChild(logEntry);
    logSection.scrollTop = logSection.scrollHeight;

    chrome.storage.local.get('logs', (data) => {
        let logs = data.logs || [];
        logs.push({ time: new Date().toISOString(), message });
        if (logs.length > MAX_LOGS) {
            logs = logs.slice(-MAX_LOGS);
        }
        chrome.storage.local.set({ logs });
    });
}

function loadLogs() {
    chrome.storage.local.get('logs', (data) => {
        const logSection = document.getElementById('logSection');
        if (!logSection) return;

        logSection.innerHTML = '';
        (data.logs || []).forEach(log => {
            const logEntry = document.createElement('p');
            logEntry.textContent = `${new Date(log.time).toLocaleTimeString()}: ${log.message}`;
            logSection.appendChild(logEntry);
        });
        logSection.scrollTop = logSection.scrollHeight;
    });
}

function handleAddPrompt() {
    const promptInput = document.getElementById('prompt');
    const repeatCountInput = document.getElementById('repeatCount');
    
    if (!promptInput || !repeatCountInput) return;

    const promptText = promptInput.value.trim();
    const repeatCount = parseInt(repeatCountInput.value);
    
    if (promptText && repeatCount > 0) {
        promptQueue.push({ text: promptText, repeats: repeatCount });
        promptInput.value = '';
        repeatCountInput.value = '1';
        updatePromptList();
        saveQueue();
        addLog(`Added new prompt: "${promptText}" (${repeatCount} times)`);
    }
}

function handleStartQueue() {
    chrome.runtime.sendMessage({action: 'startProcess'});
    updateButtonState(true);
}

function handleCancelProcess() {
    chrome.runtime.sendMessage({action: 'stopProcess'});
    updateButtonState(false);
}

document.addEventListener('DOMContentLoaded', () => {
    const addPromptButton = document.getElementById('addPrompt');
    const startQueueButton = document.getElementById('startQueue');
    const cancelProcessButton = document.getElementById('cancelProcess');

    if (addPromptButton) addPromptButton.addEventListener('click', handleAddPrompt);
    if (startQueueButton) startQueueButton.addEventListener('click', handleStartQueue);
    if (cancelProcessButton) cancelProcessButton.addEventListener('click', handleCancelProcess);

    loadQueue();
    loadLogs();
    
    chrome.storage.sync.get(['promptQueue', 'isRunning'], (data) => {
        if (data.promptQueue) {
            promptQueue = data.promptQueue;
            updatePromptList();
        }
        updateButtonState(data.isRunning);
    });

    chrome.storage.local.get('status', (data) => {
        const statusElement = document.getElementById('status');
        if (statusElement && data.status) {
            statusElement.textContent = data.status;
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'log') {
        addLog(message.content);
    }
});