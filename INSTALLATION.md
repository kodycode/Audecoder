# Audecoder Installation Guide

This guide will walk you through installing the Audecoder browser extension for YouTube Music.

## Chrome Installation

### Method 1: Developer Mode (Recommended for testing)

1. **Download the Extension**
   - Download or clone the Audecoder extension files
   - Extract to a folder on your computer

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar and press Enter
   - Alternatively, go to Chrome menu > More Tools > Extensions

3. **Enable Developer Mode**
   - Look for the "Developer mode" toggle in the top-right corner
   - Click to enable it (the toggle should turn blue)

4. **Load the Extension**
   - Click the "Load unpacked" button that appears
   - Navigate to the folder containing the Audecoder extension files
   - Select the folder and click "Select Folder"

5. **Verify Installation**
   - You should see the Audecoder extension in your extensions list
   - The extension icon should appear in your browser toolbar
   - If the icon isn't visible, click the puzzle piece icon and pin Audecoder

## Firefox Installation

### Method 1: Temporary Installation (For testing)

1. **Download the Extension**
   - Download or clone the Audecoder extension files
   - Keep the files in an accessible folder

2. **Open Firefox Debugging Page**
   - Open Mozilla Firefox
   - Type `about:debugging` in the address bar and press Enter

3. **Access This Firefox**
   - Click "This Firefox" in the left sidebar
   - You'll see the temporary extensions section

4. **Load the Extension**
   - Click "Load Temporary Add-on"
   - Navigate to the Audecoder extension folder
   - Select the `manifest.json` file
   - Click "Open"

5. **Verify Installation**
   - The extension should appear in the temporary extensions list
   - The Audecoder icon should appear in your Firefox toolbar

### Method 2: Permanent Installation (Signed extension required)

*Note: For permanent installation in Firefox, the extension needs to be signed by Mozilla or installed through Firefox Add-ons store.*

## Edge Installation

Edge uses the same process as Chrome:

1. **Open Edge Extensions Page**
   - Type `edge://extensions/` in the address bar

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the left sidebar

3. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Select the Audecoder extension folder

## Verification Steps

After installation in any browser:

1. **Check Extension Icon**
   - Look for the Audecoder icon in your browser toolbar
   - The icon should be visible and clickable

2. **Test on YouTube Music**
   - Navigate to [music.youtube.com](https://music.youtube.com)
   - Start playing a song
   - Click the Audecoder extension icon
   - You should see the popup interface

3. **Enable Decoder**
   - In the popup, click "Enable Decoder"
   - You should see the status change to "Active"
   - Audio decoding should be applied to encoded tracks

## Troubleshooting

### Extension Not Loading

**Chrome/Edge:**
- Make sure Developer mode is enabled
- Check that all extension files are in the selected folder
- Look for error messages in the extensions page

**Firefox:**
- Ensure you selected the `manifest.json` file specifically
- Check the browser console for error messages

### Icon Not Visible

**All Browsers:**
- Look for a puzzle piece or extensions icon in the toolbar
- Click it to see hidden extensions
- Pin the Audecoder extension for easy access

### Extension Not Working on YouTube Music

1. **Check URL**
   - Make sure you're on `music.youtube.com` (not regular `youtube.com`)
   - The extension only works on YouTube Music

2. **Refresh the Page**
   - Reload the YouTube Music page after installing the extension
   - Wait for the page to fully load before testing

3. **Check Audio Playback**
   - Ensure an encoded track is actually playing
   - The extension only decodes files encoded with our encoder

### Permission Issues

**Chrome/Edge:**
- Check if the extension has proper permissions in `chrome://extensions/`
- Look for any permission warnings or errors

**Firefox:**
- Check `about:addons` for permission-related issues
- Ensure the extension has access to YouTube Music

## Advanced Installation

### Building from Source

If you want to build the extension from source code:

```bash
# Clone the repository
git clone https://github.com/yourusername/audecoder-extension.git
cd audecoder-extension

# Install development dependencies (if any)
npm install

# Build the extension (if build process exists)
npm run build
```

### Creating a Package

**For Chrome (.crx file):**
- Use Chrome's built-in packaging in Developer mode
- Or use command-line tools like `chrome-extension-pack`

**For Firefox (.xpi file):**
- Use `web-ext` tool: `web-ext build`
- Or zip the extension files manually

## Security Notes

- Only install extensions from trusted sources
- Review the extension's permissions before installation
- Be aware that the extension decodes audio in real-time
- Only works with audio files encoded using our encoder application
- High amplification settings may cause audio distortion

## Getting Help

If you encounter issues during installation:

1. **Check the README.md** for detailed information
2. **Review browser console** for error messages
3. **File an issue** on the project's GitHub repository
4. **Check compatibility** with your browser version

## Next Steps

After successful installation:

1. **Read the Usage Guide** in the main README
2. **Understand the Audio Decoding** and how it works
3. **Adjust Settings** according to your preferences
4. **Report Issues** if you encounter any problems

---

**Note:** This extension is in active development. Installation steps may change with future updates.