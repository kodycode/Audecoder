# Audecoder Extension

A browser extension that decodes audio files encoded with the included encoder application when played on YouTube Music. The extension automatically detects tracks with "audecode" in their title and applies real-time decoding.

[Video Demo](https://youtu.be/oooTLFSkq-k)

(Song sounds low-quality during live decoding because I'm a bad music producer)

## Features

### Browser Extension
- 🎵 **Real-time Audio Decoding** - Automatically detects and decodes audio files encoded with our encoder
- 🔧 **Advanced Filtering** - Uses multiple notch filters targeting interference frequencies (200Hz-16000Hz range)
- 🔊 **Signal Amplification** - Applies 100x gain to boost filtered audio signals
- 🎛️ **Easy Toggle** - Simple on/off control via browser extension popup
- 🔄 **Smart Detection** - Automatically detects tracks with "audecode" in title and applies decoding
- 🎧 **Stereo to Mono** - Converts audio to mono for improved clarity
- ⚡ **Real-time Processing** - Low-latency audio processing with automatic start/stop

### Standalone Encoder
- 📁 **File Upload** - Supports MP3, WAV, and other common audio formats
- 🎚️ **Configurable Parameters** - Adjust base frequency, amplitude, and source volume
- 🎼 **Sine Wave Injection** - Adds high-frequency interference at (frequency + 6000Hz) and (frequency + 15000Hz)
- ▶️ **Preview Playback** - Compare original vs encoded audio before download
- 💾 **WAV Export** - Download encoded audio files for use anywhere

## How It Works

The system uses a **frequency-based obfuscation method**:

1. **Encoding Process** (Encoder App):
   - Takes original audio file (any Web Audio API supported format)
   - Reduces original volume to 3% (default, configurable)
   - Generates two high-frequency sine waves at:
     - `base_frequency + 6000Hz` (default: 600 + 6000 = 6600Hz)
     - `base_frequency + 15000Hz` (default: 600 + 15000 = 15600Hz)
   - Mixes scaled original + interference at specified amplitude (default: 0.1)
   - Results in unintelligible audio that sounds like noise
   - Outputs both WAV and MP3 formats with "audecode" suffix

2. **Decoding Process** (Browser Extension):
   - Monitors YouTube Music for tracks with "audecode" in title
   - Creates Web Audio API processing chain when detected
   - Converts stereo to mono using channel splitter/merger
   - Applies series of notch filters to remove interference frequencies
   - Amplifies the remaining signal (100x gain)
   - Automatically suspends/resumes with playback state
   - Outputs clear, audible music in real-time

## Installation

### Browser Extension

1. Clone this repository
2. Open Chrome/Firefox and navigate to extensions page
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

### Encoder Application

Simply open `encoder.html` in any modern web browser - no installation required!

## Usage

### Creating Encoded Audio

1. Open `encoder.html` in your browser
2. Upload an audio file (any format supported by Web Audio API)
3. Adjust encoding parameters if desired:
   - **Base Frequency**: Starting frequency for sine wave generation (default: 600Hz)
   - **Amplitude**: Interference strength (default: 0.1)
   - **Source Volume**: Original audio volume in mix (default: 0.03)
4. Click "Encode Audio" and wait for processing
5. Preview both original and encoded versions
6. Download the encoded file in WAV or MP3 format (automatically includes "audecode" suffix)

<img width="2560" height="1303" alt="Screenshot 2025-08-04 at 10 58 27 PM" src="https://github.com/user-attachments/assets/add47f37-8eef-4b04-9d0d-61becc1949cd" />

### Decoding with Extension

1. Upload your encoded audio to YouTube Music (ensure filename contains "audecode")
2. Navigate to music.youtube.com
3. Start playing the encoded track
4. Click the Audecoder extension icon
5. Click "Enable Decoder"
6. The extension will automatically detect the audecode track and apply decoding
7. For safety, decoding only activates when track title contains "audecode"

<img width="1723" height="959" alt="Screenshot 2025-08-04 at 11 00 57 PM" src="https://github.com/user-attachments/assets/11cdb730-3b93-4de2-8d00-bf926d3575c1" />

## Technical Details

### Audio Processing Pipeline

**Encoding (JavaScript/Web Audio API):**
```javascript
// Mix original audio with high-frequency sine waves
scaledOriginal = originalAudio * sourceVolume (0.03)
sine1 = sin(2π * (baseFreq + 6000) * time) * amplitude
sine2 = sin(2π * (baseFreq + 15000) * time) * amplitude
encodedAudio = scaledOriginal + (sine1 + sine2) * 0.5
```

**Decoding (Browser Extension/Web Audio API):**
```javascript
// Audio processing chain
audioGraph: source → channelSplitter → leftGain(0.5) + rightGain(0.5) → 
           channelMerger → notchFilters(series) → 100x gain → destination

// Notch filter configuration
notchFrequencies: [200, 440, 6600, 15600, 5000, 6000, 6300, 8000, 10000, 12500, 14000, 15000, 15500, 15900, 16000]
filterQ: [3, 2, 1, 1, 20, 20, 5, 40, 40, 40, 40, 40, 1, 1, 40] * 3.5
filterGain: [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1]
```

### Browser Compatibility

- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Partial support (Web Audio API limitations)
- **Edge**: Full support

### File Format Support

**Input formats** (Encoder): Any format supported by Web Audio API (MP3, WAV, FLAC, OGG, M4A, AAC, etc.)

**Output formats** (Encoder): WAV (16-bit, mono) and MP3 (with "audecode" suffix automatically added)

**Playback** (Extension): Any format supported by YouTube Music

## Configuration

### Extension Settings

The extension automatically applies optimal settings for most encoded audio:

- **Output Gain**: 100x amplification
- **Notch Filters**: 15 filters targeting frequencies from 200Hz to 16000Hz
- **Q Factor**: Variable Q values (1-40) multiplied by 3.5 for filter sharpness
- **Processing**: Real-time, low-latency with automatic state management
- **Safety**: Only activates for tracks with "audecode" in title

### Encoder Parameters

Adjust these in the encoder interface:

- **Base Frequency** (default: 600Hz): Starting frequency for interference generation
- **Amplitude** (default: 0.1): Interference signal strength - higher values create more aggressive encoding
- **Source Volume** (default: 0.03): Original audio level in the mix - lower values provide better obfuscation

## Troubleshooting

### Extension Issues

**Audio not decoding:**
- Verify you're on music.youtube.com
- Ensure track title contains "audecode" (safety feature)
- Check that the track was encoded with our encoder application
- Try the "Restart Decoder" button in the extension popup
- Refresh the page and re-enable the extension

**Poor audio quality:**
- Encoding may be too aggressive - try lower amplitude settings in encoder
- Original file quality may be low
- Browser audio processing limitations
- Try different encoding parameters

**Extension not working:**
- Check browser console for errors (F12)
- Verify extension is enabled and up-to-date
- Ensure you're on the correct YouTube Music URL
- Check that Web Audio API is supported in your browser

### Encoder Issues

**File won't load:**
- Check file format compatibility
- Try converting to WAV first
- Ensure file isn't corrupted

**Encoding takes too long:**
- Large files require more processing time
- Close other browser tabs to free up memory
- Try with shorter audio clips first

## Development

### Project Structure

```
audecoder-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Content script with audio processing logic
├── popup.html/js/css      # Extension popup UI
├── encoder.html           # Standalone encoder web interface
├── encoder.js             # Web Audio API encoder implementation
├── icons/                 # Extension icons (16px to 128px)
├── INSTALLATION.md        # Detailed installation guide
├── LICENSE               # GPL v3 License
└── README.md             # This file
```

### Key Files

- **background.js**: Content script with Web Audio API implementation for real-time decoding
- **encoder.js**: Standalone encoder using Web Audio API for client-side audio processing
- **popup.js**: Extension popup UI with browser/content script communication
- **manifest.json**: Manifest V3 extension configuration with required permissions

### Contributing

1. Fork the repository
2. Create a feature branch
3. Test thoroughly with different audio files
4. Submit a pull request

## License

GPL v3 License - see LICENSE file for details

## Credits

- **Heavily inspired by [UnsafeYT](https://github.com/alex-suspicious/UnsafeYT)** by alex-suspicious - The original audio obfuscation project for YouTube videos
- Audio encoding method adapted from [UnsafeYTools](https://github.com/alex-suspicious/UnsafeYTools) audio.h implementation  
- Built with Web Audio API and modern browser technologies
- Extension architecture based on Manifest V3 standards
- Special thanks to the UnsafeYT community for pioneering audio obfuscation techniques

## Disclaimer

This tool is for educational and research purposes. Please respect copyright laws and platform terms of service when using encoded audio content.
