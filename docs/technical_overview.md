# System Specification - Hailuo Video Generator Extension

## 1. Overview

The Hailuo Video Generator Extension is a Chrome extension designed to automate the video creation process on hailuoai.com/video. The extension allows users to input multiple prompts, set the number of times each prompt should run, and execute the process automatically.

## 2. Architecture

The extension consists of the following components:

1. **Manifest** (manifest.json)
2. **Background Script** (background.js)
3. **Content Script** (content.js)
4. **Utility Functions** (utils.js)
5. **DOM Interactions** (domInteractions.js)
6. **Storage Handling** (storage.js)
7. **Popup Interface** (popup.html, popup.js)

### 2.1 Architecture Diagram

```
+-------------------+
|    Popup (UI)     |
+-------------------+
          |
          v
+-------------------+
|  Chrome Storage   |
+-------------------+
          ^
          |
+-------------------+
| Background Script |
+-------------------+
          ^
          |
+-------------------+
|  Content Script   |
+-------------------+
    |     |     |
    v     v     v
+------+ +------+ +------+
| Utils| |  DOM  | |Storage|
+------+ +------+ +------+
```

## 3. Component Descriptions

### 3.1 Manifest (manifest.json)

Defines the extension's properties, permissions, and script locations.

### 3.2 Background Script (background.js)

Handles extension installation and initialization of storage.

### 3.3 Content Script (content.js)

Main logic for interacting with the webpage. It manages the prompt queue and executes prompts.

### 3.4 Utility Functions (utils.js)

Contains helper functions used across the extension, such as logging and sleep functions.

### 3.5 DOM Interactions (domInteractions.js)

Handles all interactions with the webpage's DOM, including typing simulation and checking for animations.

### 3.6 Storage Handling (storage.js)

Manages reading from and writing to Chrome's storage.

### 3.7 Popup Interface (popup.html, popup.js)

Provides the user interface for adding prompts and controlling the extension.

## 4. Workflow

1. User adds prompts through the popup interface.
2. Prompts are stored in Chrome's storage.
3. Content script checks for stored prompts and execution status.
4. If running, content script executes prompts one by one:
   a. Clears existing text in the input field.
   b. Types the new prompt.
   c. Clicks the "Generate Video" button.
   d. Waits for the loading animation to appear and disappear.
   e. Moves to the next prompt or repeats as necessary.
5. Process continues until all prompts are executed or user cancels.

## 5. Key Features

- Simulates human-like typing for natural interaction with the website.
- Manages a queue of prompts with repeat functionality.
- Waits for video generation to complete before moving to the next prompt.
- Provides logging for monitoring the process.
- Persists prompt queue and status across browser sessions.

## 6. Technical Specifications

- **Language**: JavaScript (ES6+)
- **Chrome Extension Manifest**: Version 3
- **Storage**: Chrome Storage Sync API
- **DOM Manipulation**: Native JavaScript
- **Module System**: ES6 Modules

## 7. Future Improvements

- Implement error recovery mechanisms for network issues or website changes.
- Add support for scheduling prompt execution at specific times.
- Develop a more advanced UI for managing large numbers of prompts.
- Implement a system for saving and loading sets of prompts.

This specification provides a high-level overview of the Hailuo Video Generator Extension's architecture and functionality. It serves as a guide for understanding the system's structure and can be used as a basis for further development or maintenance.