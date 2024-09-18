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
    <div class="prompt-crafter-toggle">
      <label>
        <input type="checkbox" id="show-prompt-crafter"> Show Prompt Crafter
      </label>
    </div>
    <div class="prompt-crafter" style="display: none;">
      <div class="api-key-section">
        <input type="password" id="openai-api-key" placeholder="Enter your OpenAI API key">
        <button id="save-api-key">Save API Key</button>
      </div>
      <div class="crafted-prompt-sections">
        <div class="prompt-section">
          <label>
            <input type="checkbox" id="keep-style">
            Style
          </label>
          <textarea id="style-prompt" placeholder="Video style description"></textarea>
        </div>
        <div class="prompt-section">
          <label>
            <input type="checkbox" id="keep-location">
            Location
          </label>
          <textarea id="location-prompt" placeholder="Location description"></textarea>
        </div>
        <div class="prompt-section">
          <label>
            <input type="checkbox" id="keep-characters">
            Characters
          </label>
          <textarea id="characters-prompt" placeholder="Characters description"></textarea>
        </div>
        <div class="prompt-section">
          <label>
            <input type="checkbox" id="keep-shot">
            Shot Details
          </label>
          <textarea id="shot-prompt" placeholder="Shot details and camera movement"></textarea>
        </div>
        <div class="prompt-section">
          <label>
            <input type="checkbox" id="keep-action">
            Action
          </label>
          <textarea id="action-prompt" placeholder="Action description"></textarea>
        </div>
      </div>
    </div>
    <div class="queue-section">
      <textarea id="assistant-prompt" placeholder="Enter your prompt here"></textarea>
      <div class="assistant-count">
        <label for="assistant-count">Number of generations:</label>
        <input type="number" id="assistant-count" min="1" value="1">
      </div>
      <div class="assistant-controls">
        <button id="craft-prompt" class="craft-button">Craft Prompt</button>
        <button id="assistant-addToQueue" class="queue-button">Add to Queue</button>
      </div>
      <div id="queue-container"></div>
      <div id="countdown-timer"></div>
      <div class="assistant-status-controls">
        <div class="status" id="assistant-status">Status: Checking...</div>
        <button id="assistant-startProcess">Start Process</button>
        <button id="assistant-stopProcess">Stop Process</button>
      </div>
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
  document.getElementById('craft-prompt').addEventListener('click', craftPrompt);
  document.getElementById('show-prompt-crafter').addEventListener('change', togglePromptCrafter);
  document.getElementById('save-api-key').addEventListener('click', saveApiKey);
  
  loadApiKey();
  loadPromptCrafterPreference();

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
    const remainingInjectionTime = nextInjectionCheckTime ? Math.max(0, nextInjectionCheckTime - now) : 0;
    
    let countdownMessage = `Next status check in: ${Math.ceil(remainingStatusTime / 1000)} seconds`;
    if (nextInjectionCheckTime !== null) {
      countdownMessage += ` | Next injection check in: ${Math.ceil(remainingInjectionTime / 1000)} seconds`;
    }
    
    countdownElement.textContent = countdownMessage;
    
    if (remainingStatusTime <= 0 && (nextInjectionCheckTime === null || remainingInjectionTime <= 0)) {
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

  // Reset the injection check time after successful injection
  nextInjectionCheckTime = null;
}

function clickGenerateButton() {
  const generateButton = document.querySelector('button.build_video');
  if (generateButton) {
    generateButton.click();
  }
}

async function craftPrompt() {
  const promptInput = document.getElementById('assistant-prompt');
  const generalPrompt = promptInput.value;
  const apiKey = getApiKey();

  if (!apiKey) {
    return;
  }

  const systemPrompt = `You are a video description assistant. Given a general prompt, provide detailed descriptions for the following aspects of a video. Each description should be no more than 100 words:
  1. Style (animation/3D/hand-drawn/Disney/Pixar etc.)
  2. Location
  3. Characters
  4. Shot details and camera movement (close-up/establish shot/medium shot, camera movement between subjects)
  5. Action

  Only provide descriptions for aspects not already specified in the input. If an aspect is already described, respond with "KEEP EXISTING" for that aspect.`;

  try {
    const response = await fetchGPTResponse(apiKey, systemPrompt, generalPrompt);
    const craftedPrompt = updateCraftedPrompts(response);
    
    // Update the assistant-prompt textarea with the crafted prompt
    promptInput.value = craftedPrompt;
  } catch (error) {
    console.error('Error crafting prompt:', error);
    alert('An error occurred while crafting the prompt. Please try again.');
  }
}

function updateCraftedPrompts(gptResponse) {
  const sections = ['style', 'location', 'characters', 'shot', 'action'];
  const lines = gptResponse.split('\n');
  let craftedPrompt = '';

  sections.forEach((section, index) => {
    const textarea = document.getElementById(`${section}-prompt`);
    const checkbox = document.getElementById(`keep-${section}`);

    let content;
    if (checkbox.checked) {
      content = textarea.value;
    } else {
      content = lines[index] && lines[index].includes(':') ? lines[index].split(':')[1].trim() : '';
      content = content !== 'KEEP EXISTING' ? content : textarea.value;
      textarea.value = content;
    }

    if (content) {
      craftedPrompt += `${section.charAt(0).toUpperCase() + section.slice(1)}: ${content}\n`;
    }
  });

  return craftedPrompt.trim();
}

function togglePromptCrafter() {
  const promptCrafter = document.querySelector('.prompt-crafter');
  const showPromptCrafter = document.getElementById('show-prompt-crafter');
  
  promptCrafter.style.display = showPromptCrafter.checked ? 'block' : 'none';
  localStorage.setItem('showPromptCrafter', showPromptCrafter.checked);
}

function loadPromptCrafterPreference() {
  const showPromptCrafter = document.getElementById('show-prompt-crafter');
  const promptCrafter = document.querySelector('.prompt-crafter');
  const savedPreference = localStorage.getItem('showPromptCrafter');
  
  if (savedPreference === 'true') {
    showPromptCrafter.checked = true;
    promptCrafter.style.display = 'block';
  } else {
    showPromptCrafter.checked = false;
    promptCrafter.style.display = 'none';
  }
}

function saveApiKey() {
  const apiKeyInput = document.getElementById('openai-api-key');
  const apiKey = apiKeyInput.value.trim();
  
  if (apiKey) {
    localStorage.setItem('openaiApiKey', apiKey);
    alert('API key saved successfully!');
  } else {
    alert('Please enter a valid API key.');
  }
}

function loadApiKey() {
  const apiKeyInput = document.getElementById('openai-api-key');
  const savedApiKey = localStorage.getItem('openaiApiKey');
  
  if (savedApiKey) {
    apiKeyInput.value = '*'.repeat(savedApiKey.length);
  }
}

function getApiKey() {
  const apiKeyInput = document.getElementById('openai-api-key');
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    alert('Please enter your OpenAI API key in the Prompt Crafter section.');
    return null;
  }
  
  return apiKey;
}

async function fetchGPTResponse(apiKey, systemPrompt, userPrompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Wait for the window to fully load before injecting UI
window.onload = () => {
  setTimeout(injectUI, 1000); // Additional 1-second delay after window load
};

// Initialize status check interval
statusCheckInterval = setInterval(checkStatus, 2000);