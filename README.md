# Hailuo Video Generator Chrome Extension

## Overview

The Hailuo Video Generator is a Chrome extension designed to automate video generation on hailuoai.com/video. This extension allows users to queue multiple prompts, set repeat counts, and automatically generate videos based on these prompts.

## Features

- Add multiple prompts to a queue
- Set repeat count for each prompt
- Automatically generate videos on hailuoai.com/video
- Real-time status updates and countdown timer
- Logging system for tracking operations
- Persistent storage of prompts and logs across browser sessions

## Installation

1. Clone this repository or download the source code.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

1. Click on the extension icon in your Chrome toolbar to open the popup.
2. Enter a prompt in the text area and set the repeat count.
3. Click "Add Prompt" to add the prompt to the queue.
4. Repeat steps 2-3 to add multiple prompts if desired.
5. Click "Start Queue" to begin the video generation process.
6. The extension will automatically navigate to hailuoai.com/video and generate videos based on your prompts.
7. You can view the current status and logs in the popup window.
8. To stop the process at any time, click "Cancel Process".

## File Structure

- `manifest.json`: Extension configuration file
- `popup.html`: HTML for the extension popup
- `popup.js`: JavaScript for the popup functionality
- `background.js`: Background script for handling extension events
- `content.js`: Content script for interacting with the hailuoai.com/video page
- `utils.js`: Utility functions used across the extension
- `domInteractions.js`: Functions for interacting with the webpage DOM
- `storage.js`: Functions for handling Chrome storage operations

## Development

To modify or extend the extension:

1. Make changes to the relevant files.
2. If you add new files, make sure to update the `manifest.json` file accordingly.
3. Reload the extension in `chrome://extensions/` by clicking the refresh icon.

## Permissions

This extension requires the following permissions:

- `activeTab`: To interact with the current tab
- `storage`: To store prompts and logs
- `https://hailuoai.com/*`: To interact with the Hailuo AI website

## Disclaimer

This extension is not officially associated with Hailuo AI. Use it responsibly and in accordance with Hailuo AI's terms of service.

## Support

For issues, feature requests, or contributions, please open an issue or pull request in this repository.

## License

[MIT License](LICENSE)