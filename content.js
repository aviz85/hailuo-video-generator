let queue = [];
let isProcessing = false;
let isAvailable = true;
let statusCheckInterval;
let injectionCheckTimeout;
let countdownInterval;
let nextStatusCheckTime;
let nextInjectionCheckTime;

function injectUI() {
  const container = document.createElement('div');
  container.className = 'assistant-container';
  container.innerHTML = `
    <textarea id="assistant-prompt" placeholder="Enter your prompt here"></textarea>
    <div class="assistant-controls">
      <input type="number" id="assistant-count" min="1" value="1">
      <button id="assistant-addToQueue">Add to Queue</button>
    </div>
    <div id="queue-container"></div>
    <div id="countdown-timer"></div>
    <div class="assistant-status-controls">
      <div class="status" id="assistant-status">Status: Checking...</div>
      <button id="assistant-startProcess">Start Process</button>
      <button id="assistant-stopProcess">Stop Process</button>
    </div>
  `;

  // Function to insert the container
  function insertContainer() {
    const insertionPoint = document.querySelector('div.mt-3 img[src="assets/img/video-top-logo.png"]');
    if (insertionPoint) {
      const parentElement = insertionPoint.closest('.mt-3');
      parentElement.insertAdjacentElement('afterend', container);
      return true;
    }
    return false;
  }

  // Try to insert the container with a delay
  setTimeout(() => {
    if (insertContainer()) {
      initializeUI();
    } else {
      console.log("Couldn't find the insertion point, waiting for DOM changes...");
      // Set up a MutationObserver to watch for changes in the DOM
      const observer = new MutationObserver((mutations, obs) => {
        if (insertContainer()) {
          initializeUI();
          obs.disconnect(); // Stop observing once we've inserted the container
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }, 2000); // 2-second delay
}

function initializeUI() {
  document.getElementById('assistant-addToQueue').addEventListener('click', addToQueue);
  document.getElementById('assistant-startProcess').addEventListener('click', startProcess);
  document.getElementById('assistant-stopProcess').addEventListener('click', stopProcess);

  // Load queue from local storage
  const savedQueue = localStorage.getItem('queue');
  if (savedQueue) {
    queue = JSON.parse(savedQueue);
    updateQueueTable();
  }

  const savedIsProcessing = localStorage.getItem('isProcessing');
  if (savedIsProcessing === 'true') {
    isProcessing = true;
    const startButton = document.getElementById('assistant-startProcess');
    startButton.textContent = 'Processing...';
    startButton.disabled = true;
    processQueue();
  }

  // Start checking status immediately
  checkStatus();
  statusCheckInterval = setInterval(checkStatus, 2000);
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
  const queueContainer = document.getElementById('queue-container');
  if (!queueContainer) {
    console.error('Queue container not found');
    return;
  }

  if (queue.length === 0) {
    queueContainer.innerHTML = '<div class="success-message">All tasks completed successfully!</div>';
    return;
  }

  // Clear the container
  queueContainer.innerHTML = '';

  // Recreate the table
  const table = document.createElement('table');
  table.id = 'assistant-queueTable';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Prompt</th>
        <th>Count</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  queueContainer.appendChild(table);

  const tbody = table.querySelector('tbody');
  queue.forEach((item, index) => {
    const row = tbody.insertRow();
    
    // Prompt cell (editable)
    const promptCell = row.insertCell(0);
    const promptInput = document.createElement('input');
    promptInput.type = 'text';
    promptInput.value = item.prompt;
    promptInput.addEventListener('change', function() {
      queue[index].prompt = this.value;
      saveQueue();
    });
    promptCell.appendChild(promptInput);
    
    // Count cell (editable)
    const countCell = row.insertCell(1);
    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.min = '1';
    countInput.value = item.count;
    countInput.addEventListener('change', function() {
      queue[index].count = parseInt(this.value);
      saveQueue();
    });
    countCell.appendChild(countInput);
    
    // Delete button
    const actionCell = row.insertCell(2);
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', function() {
      queue.splice(index, 1);
      updateQueueTable();
      saveQueue();
    });
    actionCell.appendChild(deleteButton);
  });

  // Add the countdown timer
  const countdownTimer = document.createElement('div');
  countdownTimer.id = 'countdown-timer';
  queueContainer.appendChild(countdownTimer);
}

function saveQueue() {
  localStorage.setItem('queue', JSON.stringify(queue));
  localStorage.setItem('isProcessing', isProcessing);
}

function updateStatus(message) {
  const statusElement = document.getElementById('assistant-status');
  if (statusElement) {
    statusElement.textContent = 'Status: ' + message;
  } else {
    console.error('Status element not found');
  }
}

function startProcess() {
  if (!isProcessing) {
    isProcessing = true;
    updateStatus('Processing started');
    processQueue();
    
    const startButton = document.getElementById('assistant-startProcess');
    startButton.textContent = 'Processing...';
    startButton.disabled = true;
    saveQueue();
  }
}

function stopProcess() {
  if (isProcessing) {
    isProcessing = false;
    updateStatus('Processing stopped');
    clearTimeout(injectionCheckTimeout);
    
    const startButton = document.getElementById('assistant-startProcess');
    startButton.textContent = 'Start Process';
    startButton.disabled = false;
    saveQueue();
  }
}

function processQueue() {
  if (isProcessing && queue.length > 0) {
    if (isAvailable) {
      const item = queue[0];
      typePrompt(item.prompt);
      
      // Update the queue immediately after starting the job
      item.count--;
      if (item.count <= 0) {
        queue.shift();
      } else {
        queue[0] = item; // Update the first item in the queue
      }
      saveQueue();
      updateQueueTable();

      // Set timeout for the first injection check after 60 seconds
      nextInjectionCheckTime = Date.now() + 60000; // 60 seconds
      clearTimeout(injectionCheckTimeout);
      injectionCheckTimeout = setTimeout(checkForInjection, 60000);
      startCountdown();
    } else {
      // If not available, start the countdown to next status check
      startCountdown();
    }
  } else if (queue.length === 0) {
    stopProcess();
    updateQueueTable(); // This will show the success message
  }
}

function checkForInjection() {
  if (isProcessing) {
    if (isAvailable) {
      processQueue();
    } else {
      // If not available, check again in 5 seconds
      nextInjectionCheckTime = Date.now() + 5000;
      injectionCheckTimeout = setTimeout(checkForInjection, 5000);
      startCountdown();
    }
  }
}

function checkStatus() {
  const loadingElement = document.querySelector('.rotate-image');
  isAvailable = !loadingElement;
  updateStatus(isAvailable ? 'Creation available' : 'Creation not available');
  
  // Always set the next status check time
  nextStatusCheckTime = Date.now() + 2000;
  
  if (isProcessing && isAvailable) {
    processQueue();
  }
}

function startCountdown() {
  const countdownElement = document.getElementById('countdown-timer');
  if (!countdownElement) {
    console.error('Countdown timer element not found');
    return;
  }

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const now = Date.now();
    const remainingStatusTime = Math.max(0, nextStatusCheckTime - now);
    const remainingInjectionTime = Math.max(0, nextInjectionCheckTime - now);
    
    let countdownMessage = `Next status check in: ${Math.ceil(remainingStatusTime / 1000)} seconds`;
    if (nextInjectionCheckTime && nextInjectionCheckTime > now) {
      countdownMessage += ` | Next injection check in: ${Math.ceil(remainingInjectionTime / 1000)} seconds`;
    }
    
    countdownElement.textContent = countdownMessage;
    
    if (remainingStatusTime <= 0 && remainingInjectionTime <= 0) {
      clearInterval(countdownInterval);
    }
  }, 100);
}

function typePrompt(prompt) {
  if (!isAvailable) {
    console.log("Creation not available, skipping prompt injection");
    return;
  }

  const textArea = document.querySelector('textarea.ant-input');
  if (textArea) {
    textArea.focus();
    
    // Set the value directly
    textArea.value = prompt;
    
    // Dispatch a single input event
    textArea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Use a timeout to allow for any potential React or framework updates
    setTimeout(() => {
      textArea.blur(); // Defocus the textarea
      clickGenerateButton();
    }, 100);
  }
}

function clickGenerateButton() {
  const generateButton = document.querySelector('button.build_video');
  if (generateButton) {
    generateButton.click();
  }
}

// Wait for the window to fully load before injecting UI
window.onload = () => {
  setTimeout(injectUI, 1000); // Additional 1-second delay after window load
};

// Initialize status check interval
statusCheckInterval = setInterval(checkStatus, 2000);