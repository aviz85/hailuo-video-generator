let queue = [];
let isProcessing = false;
let isAvailable = true;
let statusCheckInterval;
let processQueueTimeout;

function injectUI() {
  const container = document.createElement('div');
  container.className = 'assistant-container';
  container.innerHTML = `
    <textarea id="assistant-prompt" placeholder="Enter your prompt here"></textarea>
    <div class="assistant-controls">
      <input type="number" id="assistant-count" min="1" value="1">
      <button id="assistant-addToQueue">Add to Queue</button>
    </div>
    <table id="assistant-queueTable">
      <thead>
        <tr>
          <th>Prompt</th>
          <th>Count</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div class="assistant-status-controls">
      <div class="status" id="assistant-status">Status: Checking...</div>
      <button id="assistant-startProcess">Start Process</button>
      <button id="assistant-stopProcess">Stop Process</button>
    </div>
  `;

  // Try to find a suitable parent element
  const parentElement = document.querySelector('.ant-form') || document.body;
  
  // Insert the container at the beginning of the parent element
  parentElement.insertBefore(container, parentElement.firstChild);

  document.getElementById('assistant-addToQueue').addEventListener('click', addToQueue);
  document.getElementById('assistant-startProcess').addEventListener('click', startProcess);
  document.getElementById('assistant-stopProcess').addEventListener('click', stopProcess);

  chrome.storage.local.get(['queue'], function(result) {
    if (result.queue) {
      queue = result.queue;
      updateQueueTable();
    }
  });

  // Start checking status immediately
  checkStatus();
  statusCheckInterval = setInterval(checkStatus, 5000);
}

function addToQueue() {
  const promptInput = document.getElementById('assistant-prompt');
  const countInput = document.getElementById('assistant-count');
  const prompt = promptInput.value.trim();
  const count = parseInt(countInput.value);
  if (prompt && count > 0) {
    queue.push({ prompt, count });
    updateQueueTable();
    saveQueue();
    promptInput.value = '';
    countInput.value = 1;
  }
}

function updateQueueTable() {
  const queueTable = document.getElementById('assistant-queueTable').getElementsByTagName('tbody')[0];
  queueTable.innerHTML = '';
  queue.forEach((item, index) => {
    const row = queueTable.insertRow();
    row.insertCell(0).textContent = item.prompt;
    row.insertCell(1).textContent = item.count;
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', function() {
      queue.splice(index, 1);
      updateQueueTable();
      saveQueue();
    });
    row.insertCell(2).appendChild(deleteButton);
  });
}

function saveQueue() {
  chrome.storage.local.set({ queue: queue });
}

function updateStatus(message) {
  const statusElement = document.getElementById('assistant-status');
  if (statusElement) {
    statusElement.textContent = 'Status: ' + message;
  }
}

function startProcess() {
  if (!isProcessing) {
    isProcessing = true;
    updateStatus('Processing started');
    processQueue();
  }
}

function stopProcess() {
  if (isProcessing) {
    isProcessing = false;
    updateStatus('Processing stopped');
    clearTimeout(processQueueTimeout);
  }
}

function processQueue() {
  if (isProcessing && queue.length > 0 && isAvailable) {
    const item = queue[0];
    typePrompt(item.prompt);
    processQueueTimeout = setTimeout(function() {
      item.count--;
      if (item.count <= 0) {
        queue.shift();
      }
      saveQueue();
      updateQueueTable();
      processQueue();
    }, 60000);
  }
}

function checkStatus() {
  const loadingElement = document.querySelector('.rotate-image');
  isAvailable = !loadingElement;
  updateStatus(isAvailable ? 'Creation available' : 'Creation not available');
}

function typePrompt(prompt) {
  const textArea = document.querySelector('textarea.ant-input');
  if (textArea) {
    textArea.focus();
    let i = 0;
    const typeInterval = setInterval(function() {
      if (i < prompt.length) {
        textArea.value += prompt[i];
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
        i++;
      } else {
        clearInterval(typeInterval);
        if (textArea.value !== prompt) {
          clearAndRetry(textArea, prompt);
        } else {
          clickGenerateButton();
        }
      }
    }, 50);
  }
}

function clearAndRetry(textArea, prompt) {
  textArea.value = '';
  textArea.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(() => typePrompt(prompt), 500);
}

function clickGenerateButton() {
  const generateButton = document.querySelector('button.build_video');
  if (generateButton) {
    generateButton.click();
  }
}

window.addEventListener('load', injectUI);