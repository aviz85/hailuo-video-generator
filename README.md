# HaiLuoAI Video Generator Assistant

## Description
The HaiLuoAI Video Generator Assistant is a Chrome extension that enhances the video generation process on the HaiLuoAI platform (https://hailuoai.com/video). It allows users to queue multiple prompts, automate the video generation process, and monitor the system's availability.

## Features
- Queue multiple prompts for video generation
- Edit and manage the queue of prompts
- Automate the process of injecting prompts and initiating video generation
- Monitor the availability status of the video generation system
- Display countdown timers for status checks and injection attempts

## Installation
1. Clone this repository or download the source code
2. Open Google Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files

## Usage
1. Navigate to https://hailuoai.com/video
2. The extension UI will be injected into the page
3. Add prompts to the queue using the provided input fields
4. Click "Start Process" to begin automated video generation
5. Monitor the status and countdown timers in the extension UI
6. Use the "Stop Process" button to halt automation at any time

## Development
To modify or extend the extension:
1. Edit the `content.js` file to change the core functionality
2. Modify `styles.css` to adjust the appearance of the injected UI
3. Update `manifest.json` if you need to change permissions or content script matches

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
[MIT License](LICENSE)

## Disclaimer
This extension is not officially associated with HaiLuoAI. Use at your own risk and in compliance with HaiLuoAI's terms of service.