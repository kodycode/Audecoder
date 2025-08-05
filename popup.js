// Audecoder Popup Script

class AudecoderPopup {
    constructor() {
        this.browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        this.elements = {};
        this.currentStatus = {
            isEnabled: false,
            isProcessing: false,
            hasPlayer: false,
            isAudecoderFile: false
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadStatus();
    }
    
    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            statusText: document.getElementById('status-text'),
            statusIndicator: document.getElementById('status-indicator'),
            playerStatus: document.getElementById('player-status'),
            audecoderStatus: document.getElementById('audecode-status'),
            toggleBtn: document.getElementById('toggle-btn'),
            toggleText: document.getElementById('toggle-text'),
            restartBtn: document.getElementById('restart-btn'),
            helpLink: document.getElementById('help-link'),
            githubLink: document.getElementById('github-link')
        };
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Toggle button
        this.elements.toggleBtn.addEventListener('click', () => {
            this.toggleEffects();
        });
        
        // Restart button
        this.elements.restartBtn.addEventListener('click', () => {
            this.restartEffects();
        });
        
        // Help link
        this.elements.helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showHelp();
        });
        
        // GitHub link
        this.elements.githubLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.openGitHub();
        });
    }
    
    /**
     * Load current status from content script
     */
    async loadStatus() {
        try {
            const tabs = await this.queryActiveTab();
            if (!tabs || tabs.length === 0) {
                this.showError('No active tab found');
                return;
            }
            
            const tab = tabs[0];
            
            // Check if we're on YouTube Music
            if (!this.isYouTubeMusic(tab.url)) {
                this.showNotYouTubeMusic();
                return;
            }
            
            // Get status from content script
            const response = await this.sendMessage(tab.id, { action: 'getStatus' });
            if (response) {
                // Also check if current track is an audecode file
                const audecoderResponse = await this.sendMessage(tab.id, { action: 'checkAudecode' });
                response.isAudecoderFile = audecoderResponse?.isAudecoderFile || false;
                this.updateStatus(response);
            } else {
                this.showError('Could not communicate with YouTube Music page');
            }
            
        } catch (error) {
            console.error('Error loading status:', error);
            this.showError('Error loading extension status');
        }
    }
    
    /**
     * Toggle audio decoder on/off
     */
    async toggleEffects() {
        const tabs = await this.queryActiveTab();
        if (!tabs || tabs.length === 0) return;
        
        const tab = tabs[0];
        this.setLoading(true);
        
        try {
            const response = await this.sendMessage(tab.id, { action: 'toggle' });
            if (response && response.success) {
                this.currentStatus.isEnabled = response.isEnabled;
                this.updateUI();
            } else {
                this.showError('Failed to toggle decoder');
            }
        } catch (error) {
            console.error('Error toggling effects:', error);
            this.showError('Error toggling decoder');
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Restart audio decoder
     */
    async restartEffects() {
        const tabs = await this.queryActiveTab();
        if (!tabs || tabs.length === 0) return;
        
        const tab = tabs[0];
        this.setLoading(true);
        
        try {
            const response = await this.sendMessage(tab.id, { action: 'restart' });
            if (response && response.success) {
                // Refresh status after restart
                setTimeout(() => this.loadStatus(), 500);
            } else {
                this.showError('Failed to restart decoder');
            }
        } catch (error) {
            console.error('Error restarting effects:', error);
            this.showError('Error restarting decoder');
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Update status display
     */
    updateStatus(status) {
        this.currentStatus = { ...this.currentStatus, ...status };
        this.updateUI();
    }
    
    /**
     * Update UI elements based on current status
     */
    updateUI() {
        const { isEnabled, isProcessing, hasPlayer, isAudecoderFile } = this.currentStatus;
        
        // Update status text and indicator
        if (isProcessing) {
            this.elements.statusText.textContent = 'Active';
            this.elements.statusIndicator.className = 'status-indicator processing';
        } else if (isEnabled) {
            this.elements.statusText.textContent = 'Enabled';
            this.elements.statusIndicator.className = 'status-indicator enabled';
        } else {
            this.elements.statusText.textContent = 'Disabled';
            this.elements.statusIndicator.className = 'status-indicator disabled';
        }
        
        // Update player status
        if (hasPlayer) {
            this.elements.playerStatus.textContent = 'Detected';
            this.elements.playerStatus.style.color = '#00ff88';
        } else {
            this.elements.playerStatus.textContent = 'Not Found';
            this.elements.playerStatus.style.color = '#ff4757';
        }
        
        // Update audecode file status
        if (isAudecoderFile) {
            this.elements.audecoderStatus.textContent = 'Detected';
            this.elements.audecoderStatus.style.color = '#00ff88';
        } else {
            this.elements.audecoderStatus.textContent = 'Not Detected';
            this.elements.audecoderStatus.style.color = '#ffa502';
        }
        
        // Update toggle button
        this.elements.toggleBtn.disabled = false;
        if (isEnabled) {
            this.elements.toggleBtn.className = 'toggle-button enabled';
            if (isAudecoderFile) {
                this.elements.toggleText.textContent = 'Disable Decoder';
            } else {
                this.elements.toggleText.textContent = 'Enabled (Waiting for Audecode Track)';
            }
        } else {
            this.elements.toggleBtn.className = 'toggle-button disabled';
            this.elements.toggleText.textContent = 'Enable Decoder';
        }
        
        // Update restart button - only enable if both enabled and audecode file detected
        this.elements.restartBtn.disabled = !isEnabled || !isAudecoderFile;
    }
    
    /**
     * Show loading state
     */
    setLoading(loading) {
        const container = document.querySelector('.container');
        if (loading) {
            container.classList.add('loading');
            this.elements.toggleBtn.disabled = true;
            this.elements.restartBtn.disabled = true;
        } else {
            container.classList.remove('loading');
            this.updateUI(); // Restore proper button states
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.elements.statusText.textContent = 'Error';
        this.elements.statusIndicator.className = 'status-indicator disabled';
        this.elements.playerStatus.textContent = message;
        this.elements.playerStatus.style.color = '#ff4757';
        this.elements.audecoderStatus.textContent = 'Unknown';
        this.elements.audecoderStatus.style.color = '#ff4757';
        this.elements.toggleBtn.disabled = true;
        this.elements.restartBtn.disabled = true;
    }
    
    /**
     * Show not YouTube Music message
     */
    showNotYouTubeMusic() {
        this.elements.statusText.textContent = 'Inactive';
        this.elements.statusIndicator.className = 'status-indicator disabled';
        this.elements.playerStatus.textContent = 'Please visit YouTube Music';
        this.elements.playerStatus.style.color = '#ffa502';
        this.elements.audecoderStatus.textContent = 'N/A';
        this.elements.audecoderStatus.style.color = '#ffa502';
        this.elements.toggleBtn.disabled = true;
        this.elements.restartBtn.disabled = true;
        this.elements.toggleText.textContent = 'Visit YouTube Music';
    }
    
    /**
     * Show help information
     */
    showHelp() {
        const helpText = `
Audecoder decodes audio files encoded with our encoder application:

• Applies 15 notch filters to remove interference (200Hz-16000Hz range)
• Uses 100x amplification to restore original volume
• Converts stereo to mono for improved clarity

Usage:
1. Navigate to music.youtube.com
2. Upload and play a track with "audecode" in the title
3. Click "Enable Decoder"
4. Extension automatically detects and processes audecode tracks

Safety Features:
• Only activates when track title contains "audecode"
• Automatically stops when switching to non-audecode tracks
• Real-time monitoring with automatic state management

Note: Track must be encoded with our encoder and have "audecode" in filename/title.
        `.trim();
        
        alert(helpText);
    }
    
    /**
     * Open GitHub repository
     */
    openGitHub() {
        this.browserAPI.tabs.create({
            url: 'https://github.com/kodythach/audecoder-extension'
        });
    }
    
    /**
     * Query for the active tab
     */
    queryActiveTab() {
        return new Promise((resolve) => {
            this.browserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
        });
    }
    
    /**
     * Send message to content script
     */
    sendMessage(tabId, message) {
        return new Promise((resolve) => {
            this.browserAPI.tabs.sendMessage(tabId, message, (response) => {
                if (this.browserAPI.runtime.lastError) {
                    console.error('Message error:', this.browserAPI.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        });
    }
    
    /**
     * Check if URL is YouTube Music
     */
    isYouTubeMusic(url) {
        return url && (
            url.includes('music.youtube.com') ||
            url.includes('m.music.youtube.com')
        );
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AudecoderPopup();
});