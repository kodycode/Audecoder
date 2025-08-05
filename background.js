// Audecoder - Audio Decoder for YouTube Music
// Adapted from UnsafeYT for YouTube Music's player architecture

let activeAudioCtx = null;
let activeSrcNode = null;
let activeGainNode = null;
let activeOutputGainNode = null;
let activeNotchFilters = [];
let currentNode = null;
let currentUrl = window.location.href;
let currentTrackTitle = '';
let isProcessing = false;
let isEnabled = false;
let pollingIntervalId = null;
let urlCheckIntervalId = null;

// Audio decoding configuration
const AUDIO_CONFIG = {
    outputGain: 100.0,
    filterFrequencies: [200, 440, 6600, 15600, 5000, 6000, 6300, 8000, 10000, 12500, 14000, 15000, 15500, 15900, 16000],
    filterEq: [3, 2, 1, 1, 20, 20, 5, 40, 40, 40, 40, 40, 1, 1, 40],
    filterCut: [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1]
};

// YouTube Music player selectors
const SELECTORS = {
    audioElement: 'audio',
    videoElement: 'video',
    player: 'ytmusic-player',
    playerBar: 'ytmusic-player-bar',
    playButton: '[aria-label="Play"], [aria-label="Pause"]'
};

/**
 * Logs messages with Audecoder prefix
 */
function log(message, type = 'log') {
    console[type](`[Audecoder] ${message}`);
}

/**
 * Gets the audio/video element from YouTube Music player
 */
function getMediaElement() {
    // Try audio element first (YouTube Music primarily uses audio)
    let mediaElement = document.querySelector(SELECTORS.audioElement);
    
    // Fallback to video element if audio not found
    if (!mediaElement) {
        mediaElement = document.querySelector(SELECTORS.videoElement);
    }
    
    return mediaElement;
}

/**
 * Checks if YouTube Music player is available and ready
 */
function isPlayerReady() {
    const player = document.querySelector(SELECTORS.player);
    const mediaElement = getMediaElement();
    return player && mediaElement;
}

/**
 * Checks if the current audio is an Audecode-encoded file
 */
function isAudecodeFile() {
    const mediaElement = getMediaElement();
    if (!mediaElement) {
        log("No media element found for audecode check");
        return false;
    }
    
    // Primary check: YouTube Music player bar title element
    const playerTitleSelector = '#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > yt-formatted-string';
    const playerTitleElement = document.querySelector(playerTitleSelector);
    
    if (playerTitleElement && playerTitleElement.textContent) {
        const titleText = playerTitleElement.textContent.toLowerCase();
        if (titleText.includes('audecode')) {
            log(`Audecode file detected in player title: "${playerTitleElement.textContent}"`);
            return true;
        } else {
            log(`Non-audecode track in player: "${playerTitleElement.textContent}" - decoder not applied`);
            return false;
        }
    }
    
    // Fallback: Check media source URL for "audecode" string
    const src = mediaElement.src || mediaElement.currentSrc || '';
    if (src.toLowerCase().includes('audecode')) {
        log("Audecode file detected in media source URL");
        return true;
    }
    
    // Fallback: Check page title for "audecode" string
    const pageTitle = document.title || '';
    if (pageTitle.toLowerCase().includes('audecode')) {
        log("Audecode file detected in page title");
        return true;
    }
    
    // Fallback: Check other track info elements for "audecode"
    const trackSelectors = [
        '.title', 
        '.song-title', 
        '[class*="title"]',
        '.ytmusic-player-bar .title',
        '.ytmusic-player-bar [class*="title"]'
    ];
    
    for (const selector of trackSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.toLowerCase().includes('audecode')) {
            log(`Audecode file detected in track element (${selector}): "${element.textContent}"`);
            return true;
        }
    }
    
    log("No audecode identifier found in any element - decoder not applied for safety");
    return false;
}

/**
 * Removes all audio decoding and cleans up resources
 */
function removeAudioEffects() {
    if (!isProcessing) {
        return;
    }
    
    log("Removing audio decoder...");
    isProcessing = false;
    
    const mediaElement = getMediaElement();
    
    // Disconnect and clean up audio nodes
    if (activeAudioCtx) {
        if (mediaElement && activeSrcNode) {
            try {
                activeSrcNode.disconnect();
            } catch (e) {
                log(`Error disconnecting source node: ${e.message}`, 'warn');
            }
            activeSrcNode = null;
        }
        
        if (activeGainNode) {
            try {
                activeGainNode.disconnect();
            } catch (e) {
                log(`Error disconnecting gain node: ${e.message}`, 'warn');
            }
            activeGainNode = null;
        }
        
        // Disconnect all notch filters
        activeNotchFilters.forEach(filter => {
            try {
                filter.disconnect();
            } catch (e) {
                log(`Error disconnecting filter: ${e.message}`, 'warn');
            }
        });
        activeNotchFilters = [];
        
        if (activeOutputGainNode) {
            try {
                activeOutputGainNode.disconnect();
            } catch (e) {
                log(`Error disconnecting output gain node: ${e.message}`, 'warn');
            }
            activeOutputGainNode = null;
        }
        
        // Close AudioContext
        activeAudioCtx.close().then(() => {
            log("AudioContext closed successfully");
            activeAudioCtx = null;
            
            // Reset media element to restore original audio
            if (mediaElement) {
                try {
                    const currentTime = mediaElement.currentTime;
                    const wasPlaying = !mediaElement.paused;
                    const currentSrc = mediaElement.src;
                    
                    mediaElement.pause();
                    mediaElement.currentTime = 0;
                    mediaElement.load();
                    
                    if (currentSrc) {
                        mediaElement.src = currentSrc;
                        mediaElement.currentTime = currentTime;
                        if (wasPlaying) {
                            mediaElement.play().catch(e => log(`Error restoring playback: ${e.message}`, 'warn'));
                        }
                    }
                    
                    log("Media element audio restored");
                } catch (e) {
                    log(`Error restoring media element: ${e.message}`, 'warn');
                }
            }
        }).catch(e => {
            log(`Error closing AudioContext: ${e.message}`, 'error');
            activeAudioCtx = null;
        });
        
        currentNode = null;
    }
    
    log("Audio decoder removed successfully");
}

/**
 * Applies audio decoding to the YouTube Music player
 */
async function applyAudioEffects() {
    if (isProcessing || !isEnabled) {
        return;
    }
    
    // Double-check for audecode file before applying effects
    if (!isAudecodeFile()) {
        log("Safety check failed: Current track is not an audecode file, aborting decoder application");
        return;
    }
    
    log("Applying audio decoder to audecode file...");
    removeAudioEffects();
    
    const mediaElement = getMediaElement();
    if (!mediaElement) {
        log("No media element found", 'error');
        return;
    }
    
    // Set CORS for cross-origin audio processing
    mediaElement.crossOrigin = "anonymous";
    
    // Create AudioContext
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        log("AudioContext not supported in this browser", 'error');
        return;
    }
    
    try {
        activeAudioCtx = new AudioCtx();
        log("AudioContext created successfully");
        
        // Create media element source
        activeSrcNode = activeAudioCtx.createMediaElementSource(mediaElement);
        log("Media element source created");
        
        // Create channel splitter for stereo to mono conversion
        const splitter = activeAudioCtx.createChannelSplitter(2);
        
        // Create gain nodes for left and right channels
        const leftGain = activeAudioCtx.createGain();
        const rightGain = activeAudioCtx.createGain();
        leftGain.gain.value = 0.5;
        rightGain.gain.value = 0.5;
        
        // Create channel merger to combine to mono
        const merger = activeAudioCtx.createChannelMerger(1);
        
        // Create output gain node with high amplification
        activeOutputGainNode = activeAudioCtx.createGain();
        activeOutputGainNode.gain.value = AUDIO_CONFIG.outputGain;
        log(`Output gain set to ${AUDIO_CONFIG.outputGain}x`);
        
        // Create notch filters
        const numFilters = AUDIO_CONFIG.filterFrequencies.length;
        activeNotchFilters = [];
        
        for (let i = 0; i < numFilters; i++) {
            const filter = activeAudioCtx.createBiquadFilter();
            filter.type = "notch";
            filter.frequency.value = AUDIO_CONFIG.filterFrequencies[i];
            filter.Q.value = AUDIO_CONFIG.filterEq[i] * 3.5;
            filter.gain.value = AUDIO_CONFIG.filterCut[i];
            activeNotchFilters.push(filter);
            
            log(`Created notch filter ${i + 1}: ${AUDIO_CONFIG.filterFrequencies[i]}Hz, Q=${AUDIO_CONFIG.filterEq[i] * 3.5}, Gain=${AUDIO_CONFIG.filterCut[i]}dB`);
        }
        
        // Connect the audio graph
        activeSrcNode.connect(splitter);
        log("Source connected to channel splitter");
        
        // Connect splitter to gain nodes
        splitter.connect(leftGain, 0);
        splitter.connect(rightGain, 1);
        
        // Connect gain nodes to merger
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 0);
        log("Channels split, gained, and merged to mono");
        
        // Set up filter chain
        currentNode = merger;
        activeGainNode = activeAudioCtx.createGain();
        activeGainNode.gain.value = 1.0;
        currentNode.connect(activeGainNode);
        currentNode = activeGainNode;
        
        // Connect notch filters in series
        if (activeNotchFilters.length > 0) {
            currentNode.connect(activeNotchFilters[0]);
            for (let i = 0; i < numFilters - 1; i++) {
                activeNotchFilters[i].connect(activeNotchFilters[i + 1]);
            }
            activeNotchFilters[numFilters - 1].connect(activeOutputGainNode);
        } else {
            currentNode.connect(activeOutputGainNode);
            log("No notch filters created", 'warn');
        }
        
        // Connect to destination
        activeOutputGainNode.connect(activeAudioCtx.destination);
        log("Audio graph connected successfully");
        
        // Handle audio context state based on playback
        const handleAudioState = async () => {
            if (!activeAudioCtx || activeAudioCtx.state === 'closed') return;
            
            if (mediaElement.paused) {
                if (activeAudioCtx.state === 'running') {
                    try {
                        await activeAudioCtx.suspend();
                        log("AudioContext suspended");
                    } catch (e) {
                        log(`Error suspending AudioContext: ${e.message}`, 'error');
                    }
                }
            } else {
                if (activeAudioCtx.state === 'suspended') {
                    try {
                        await activeAudioCtx.resume();
                        log("AudioContext resumed");
                    } catch (e) {
                        log(`Error resuming AudioContext: ${e.message}`, 'error');
                    }
                }
            }
        };
        
        // Add event listeners for play/pause
        mediaElement.addEventListener("play", handleAudioState);
        mediaElement.addEventListener("pause", handleAudioState);
        
        // Handle initial state
        if (!mediaElement.paused) {
            handleAudioState();
        }
        
        isProcessing = true;
        log("Audio decoder applied successfully");
        
    } catch (error) {
        log(`Error applying audio decoder: ${error.message}`, 'error');
        removeAudioEffects();
    }
}

/**
 * Checks for player state changes and applies decoding when needed
 */
function checkPlayerState() {
    if (!isEnabled) {
        return;
    }
    
    // Get current track title for change detection
    const playerTitleElement = document.querySelector('#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > yt-formatted-string');
    const newTrackTitle = playerTitleElement ? playerTitleElement.textContent.trim() : '';
    
    // Check if track has changed
    if (newTrackTitle !== currentTrackTitle) {
        log(`Track changed: "${currentTrackTitle}" → "${newTrackTitle}"`);
        currentTrackTitle = newTrackTitle;
        
        // Remove effects immediately when track changes
        if (isProcessing) {
            log("Removing effects due to track change");
            removeAudioEffects();
        }
    }
    
    if (isPlayerReady()) {
        const mediaElement = getMediaElement();
        if (mediaElement && !mediaElement.paused) {
            // Check if current track is audecode and needs decoder effects
            if (isAudecodeFile()) {
                if (!isProcessing) {
                    log("Audecode track playing - applying decoder effects...");
                    applyAudioEffects();
                }
            } else {
                // Non-audecode track - make sure effects are off
                if (isProcessing) {
                    log("Non-audecode track detected - removing decoder effects");
                    removeAudioEffects();
                }
            }
        } else if (mediaElement && mediaElement.paused && isProcessing) {
            // Paused - remove effects to save resources
            log("Media paused - removing decoder effects");
            removeAudioEffects();
        }
    }
}

/**
 * Initializes the script and sets up monitoring
 */
function initializeScript() {
    log("Initializing Audecoder...");
    
    // Load settings from storage
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    if (browserAPI && browserAPI.storage) {
        browserAPI.storage.local.get(['audecoderEnabled'], (result) => {
            isEnabled = result.audecoderEnabled !== false; // Default to true
            log(`Extension enabled: ${isEnabled}`);
            
            if (isEnabled) {
                startMonitoring();
            }
        });
    } else {
        // Fallback if storage API not available
        isEnabled = true;
        startMonitoring();
    }
}

/**
 * Starts monitoring for player changes
 */
function startMonitoring() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
    }
    
    // Poll for player state changes every 300ms for more responsive track detection
    pollingIntervalId = setInterval(checkPlayerState, 300);
    log("Player monitoring started with track change detection");
}

/**
 * Stops monitoring for player changes
 */
function stopMonitoring() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
    log("Player monitoring stopped");
}

/**
 * Handles URL changes (SPA navigation)
 */
function handleUrlChange() {
    log("URL change detected");
    
    // Remove decoder on navigation
    removeAudioEffects();
    
    // Reset track title tracking
    currentTrackTitle = '';
    
    // Restart monitoring after a short delay
    setTimeout(() => {
        if (isEnabled) {
            checkPlayerState();
        }
    }, 1000);
}

/**
 * Sets up URL change monitoring for SPA navigation
 */
function setupUrlMonitoring() {
    if (urlCheckIntervalId) {
        clearInterval(urlCheckIntervalId);
    }
    
    currentUrl = location.href.split("&")[0].split("#")[0];
    urlCheckIntervalId = setInterval(() => {
        const newUrl = location.href.split("&")[0].split("#")[0];
        if (newUrl !== currentUrl) {
            currentUrl = newUrl;
            handleUrlChange();
        }
    }, 500);
}

// Message listener for popup communication
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
if (browserAPI && browserAPI.runtime) {
    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
        log(`Received message: ${request.action}`);
        
        switch (request.action) {
            case "getStatus":
                sendResponse({
                    isEnabled: isEnabled,
                    isProcessing: isProcessing,
                    hasPlayer: isPlayerReady()
                });
                break;
                
            case "checkAudecode":
                sendResponse({
                    isAudecoderFile: isAudecodeFile()
                });
                break;
                
            case "enable":
                isEnabled = true;
                if (browserAPI.storage) {
                    browserAPI.storage.local.set({ audecoderEnabled: true });
                }
                startMonitoring();
                checkPlayerState();
                sendResponse({ success: true, isEnabled: true });
                break;
                
            case "disable":
                isEnabled = false;
                if (browserAPI.storage) {
                    browserAPI.storage.local.set({ audecoderEnabled: false });
                }
                stopMonitoring();
                removeAudioEffects();
                sendResponse({ success: true, isEnabled: false });
                break;
                
            case "toggle":
                if (isEnabled) {
                    // Disable
                    isEnabled = false;
                    if (browserAPI.storage) {
                        browserAPI.storage.local.set({ audecoderEnabled: false });
                    }
                    stopMonitoring();
                    removeAudioEffects();
                } else {
                    // Enable
                    isEnabled = true;
                    if (browserAPI.storage) {
                        browserAPI.storage.local.set({ audecoderEnabled: true });
                    }
                    startMonitoring();
                    checkPlayerState();
                }
                sendResponse({ success: true, isEnabled: isEnabled });
                break;
                
            case "restart":
                if (isEnabled) {
                    removeAudioEffects();
                    setTimeout(() => {
                        checkPlayerState();
                    }, 500);
                }
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ error: "Unknown action" });
        }
        
        return true; // Keep message channel open for async response
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScript);
} else {
    initializeScript();
}

// Set up URL monitoring for SPA navigation
setupUrlMonitoring();

log("Audecoder background script loaded");