// Audecoder - Audio Encoder
// Encodes audio files using high-frequency sine wave injection
// Compatible with Audecoder Browser Extension

class AudioEncoder {
    constructor() {
        this.audioContext = null;
        this.originalBuffer = null;
        this.encodedBuffer = null;
        this.originalUrl = null;
        this.encodedUrl = null;
        this.encodedMp3Blob = null;
        this.encodedWavBlob = null;
        this.originalFileName = null;
        
        this.settings = {
            baseFrequency: 600,
            amplitude: 0.1,
            sourceVolume: 0.03
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateRangeValues();
    }
    
    initializeElements() {
        this.elements = {
            audioFile: document.getElementById('audioFile'),
            encodeBtn: document.getElementById('encodeBtn'),
            playOriginal: document.getElementById('playOriginal'),
            playEncoded: document.getElementById('playEncoded'),
            downloadWavBtn: document.getElementById('downloadWavBtn'),
            downloadMp3Btn: document.getElementById('downloadMp3Btn'),
            progress: document.getElementById('progress'),
            progressBar: document.getElementById('progressBar'),
            status: document.getElementById('status'),
            originalAudio: document.getElementById('originalAudio'),
            encodedAudio: document.getElementById('encodedAudio'),
            baseFrequency: document.getElementById('baseFrequency'),
            amplitude: document.getElementById('amplitude'),
            sourceVolume: document.getElementById('sourceVolume'),
            freqValue: document.getElementById('freqValue'),
            ampValue: document.getElementById('ampValue'),
            srcValue: document.getElementById('srcValue'),
            amplificationFactor: document.getElementById('amplificationFactor')
        };
    }
    
    setupEventListeners() {
        // File input
        this.elements.audioFile.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        // Control buttons
        this.elements.encodeBtn.addEventListener('click', () => {
            this.encodeAudio();
        });
        
        this.elements.playOriginal.addEventListener('click', () => {
            this.playAudio('original');
        });
        
        this.elements.playEncoded.addEventListener('click', () => {
            this.playAudio('encoded');
        });
        
        this.elements.downloadWavBtn.addEventListener('click', () => {
            this.downloadEncoded('wav');
        });
        
        this.elements.downloadMp3Btn.addEventListener('click', () => {
            this.downloadEncoded('mp3');
        });
        
        // Range inputs
        this.elements.baseFrequency.addEventListener('input', (e) => {
            this.settings.baseFrequency = parseInt(e.target.value);
            this.elements.freqValue.textContent = `${this.settings.baseFrequency} Hz`;
        });
        
        this.elements.amplitude.addEventListener('input', (e) => {
            this.settings.amplitude = parseFloat(e.target.value);
            this.elements.ampValue.textContent = this.settings.amplitude.toFixed(2);
        });
        
        this.elements.sourceVolume.addEventListener('input', (e) => {
            this.settings.sourceVolume = parseFloat(e.target.value);
            this.elements.srcValue.textContent = this.settings.sourceVolume.toFixed(3);
            this.updateAmplificationDisplay();
        });
        

    }
    
    updateRangeValues() {
        this.elements.freqValue.textContent = `${this.settings.baseFrequency} Hz`;
        this.elements.ampValue.textContent = this.settings.amplitude.toFixed(2);
        this.elements.srcValue.textContent = this.settings.sourceVolume.toFixed(3);
        this.updateAmplificationDisplay();
    }
    
    updateAmplificationDisplay() {
        // Calculate the amplification factor needed to restore original volume
        // Assuming decoder uses 100x base amplification to restore to normal level
        const baseAmplification = 100;
        const normalizedSourceVolume = 0.03; // What we consider "normal" source volume
        const amplificationFactor = Math.round(baseAmplification * (normalizedSourceVolume / this.settings.sourceVolume));
        
        if (this.elements.amplificationFactor) {
            this.elements.amplificationFactor.textContent = `${amplificationFactor}x`;
        }
    }
    
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Store original filename for later use
        this.originalFileName = file.name;
        
        this.showStatus('Loading audio file...', 'info');
        this.showProgress(true);
        this.updateProgress(25);
        
        try {
            // Initialize AudioContext if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Read file as ArrayBuffer
            const arrayBuffer = await this.fileToArrayBuffer(file);
            this.updateProgress(50);
            
            // Decode audio data
            this.originalBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.updateProgress(75);
            
            // Create URL for original audio
            if (this.originalUrl) {
                URL.revokeObjectURL(this.originalUrl);
            }
            this.originalUrl = URL.createObjectURL(file);
            this.elements.originalAudio.src = this.originalUrl;
            this.elements.originalAudio.style.display = 'block';
            
            this.updateProgress(100);
            this.showStatus(`Audio loaded: ${file.name}`, 'success');
            this.elements.encodeBtn.disabled = false;
            this.elements.playOriginal.disabled = false;
            
            setTimeout(() => {
                this.showProgress(false);
            }, 500);
            
        } catch (error) {
            console.error('Error loading audio:', error);
            this.showStatus('Error loading audio file. Please try a different file.', 'error');
            this.showProgress(false);
        }
    }
    
    async encodeAudio() {
        if (!this.originalBuffer) {
            this.showStatus('Please select an audio file first', 'error');
            return;
        }
        
        this.showStatus('Encoding audio...', 'info');
        this.showProgress(true);
        this.updateProgress(0);
        this.elements.encodeBtn.disabled = true;
        
        try {
            // Get audio parameters
            const sampleRate = this.originalBuffer.sampleRate;
            const duration = this.originalBuffer.duration;
            const channels = this.originalBuffer.numberOfChannels;
            
            this.updateProgress(10);
            
            // Calculate frequencies (audible range for maximum obfuscation against detection services)
            const freq1 = this.settings.baseFrequency + 6000;  // High frequency 1
            const freq2 = this.settings.baseFrequency + 15000; // High frequency 2
            
            console.log(`Encoding with frequencies: ${freq1}Hz, ${freq2}Hz`);
            this.updateProgress(20);
            
            // Create new buffer for encoded audio
            const encodedLength = this.originalBuffer.length;
            this.encodedBuffer = this.audioContext.createBuffer(1, encodedLength, sampleRate); // Force mono
            const encodedData = this.encodedBuffer.getChannelData(0);
            
            this.updateProgress(30);
            
            // Get original audio data (mix to mono if stereo)
            let originalData;
            if (channels === 1) {
                originalData = this.originalBuffer.getChannelData(0);
            } else {
                // Mix stereo to mono
                const leftChannel = this.originalBuffer.getChannelData(0);
                const rightChannel = this.originalBuffer.getChannelData(1);
                originalData = new Float32Array(encodedLength);
                for (let i = 0; i < encodedLength; i++) {
                    originalData[i] = (leftChannel[i] + rightChannel[i]) * 0.5;
                }
            }
            
            this.updateProgress(50);
            
            // Generate sine waves and mix with original
            for (let i = 0; i < encodedLength; i++) {
                const time = i / sampleRate;
                
                // Generate sine waves at obfuscation frequencies
                const sine1 = Math.sin(2 * Math.PI * freq1 * time);
                const sine2 = Math.sin(2 * Math.PI * freq2 * time);
                
                // Mix: scaled original + high-frequency interference
                const scaledOriginal = originalData[i] * this.settings.sourceVolume;
                const interference = (sine1 + sine2) * this.settings.amplitude * 0.5;
                
                encodedData[i] = scaledOriginal + interference;
                
                // Update progress periodically
                if (i % Math.floor(encodedLength / 20) === 0) {
                    this.updateProgress(50 + (i / encodedLength) * 40);
                    await this.delay(1); // Allow UI updates
                }
            }
            
            this.updateProgress(90);
            
            // Convert to WAV blob for playback and download
            this.encodedWavBlob = this.bufferToWav(this.encodedBuffer);
            
            this.updateProgress(93);
            
            // Convert to MP3 blob for download
            this.encodedMp3Blob = await this.bufferToMp3(this.encodedBuffer);
            
            this.updateProgress(97);
            
            if (this.encodedUrl) {
                URL.revokeObjectURL(this.encodedUrl);
            }
            this.encodedUrl = URL.createObjectURL(this.encodedWavBlob);
            
            this.elements.encodedAudio.src = this.encodedUrl;
            this.elements.encodedAudio.style.display = 'block';
            
            this.updateProgress(100);
            this.showStatus('Audio encoding completed! Both WAV and MP3 ready for download.', 'success');
            
            this.elements.playEncoded.disabled = false;
            this.elements.downloadWavBtn.disabled = false;
            this.elements.downloadMp3Btn.disabled = false;
            this.elements.encodeBtn.disabled = false;
            
            setTimeout(() => {
                this.showProgress(false);
            }, 500);
            
        } catch (error) {
            console.error('Encoding error:', error);
            this.showStatus('Error encoding audio. Please try again.', 'error');
            this.showProgress(false);
            this.elements.encodeBtn.disabled = false;
        }
    }
    
    playAudio(type) {
        const audio = type === 'original' ? this.elements.originalAudio : this.elements.encodedAudio;
        if (audio.src) {
            audio.currentTime = 0;
            audio.play();
        }
    }
    
    downloadEncoded(format = 'wav') {
        let blob, fileName, formatName;
        
        // Extract song name from original filename (remove extension)
        let songName = 'audecode';
        if (this.originalFileName) {
            // Remove file extension and clean up the name
            songName = this.originalFileName.replace(/\.[^/.]+$/, '');
            // Remove common audio format indicators and clean up
            songName = songName.replace(/[\[\]()]/g, '').trim();
        }
        
        if (format === 'mp3') {
            if (!this.encodedMp3Blob) {
                this.showStatus('No encoded MP3 available for download', 'error');
                return;
            }
            blob = this.encodedMp3Blob;
            fileName = `${songName} - audecode.mp3`;
            formatName = 'MP3';
        } else {
            if (!this.encodedWavBlob) {
                this.showStatus('No encoded WAV available for download', 'error');
                return;
            }
            blob = this.encodedWavBlob;
            fileName = `${songName} - audecode.wav`;
            formatName = 'WAV';
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showStatus(`${formatName} download started!`, 'success');
    }
    
    // Utility functions
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showProgress(show) {
        this.elements.progress.style.display = show ? 'block' : 'none';
        if (!show) {
            this.updateProgress(0);
        }
    }
    
    updateProgress(percent) {
        this.elements.progressBar.style.width = `${percent}%`;
    }
    
    showStatus(message, type) {
        this.elements.status.textContent = message;
        this.elements.status.className = `status ${type}`;
        this.elements.status.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                this.elements.status.style.display = 'none';
            }, 3000);
        }
    }
    
    // Convert AudioBuffer to WAV blob
    bufferToWav(buffer) {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const bitsPerSample = 16;
        const bytesPerSample = bitsPerSample / 8;
        const blockAlign = numberOfChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = length * blockAlign;
        const bufferSize = 44 + dataSize;
        
        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);
        
        // Convert audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
    
    // Convert AudioBuffer to MP3 blob using lamejs
    async bufferToMp3(buffer) {
        return new Promise((resolve, reject) => {
            try {
                const sampleRate = buffer.sampleRate;
                const samples = buffer.getChannelData(0); // Use first channel for mono
                const sampleBlockSize = 1152; // MP3 frame size
                
                // Convert float samples to 16-bit PCM
                const int16Array = new Int16Array(samples.length);
                for (let i = 0; i < samples.length; i++) {
                    const sample = Math.max(-1, Math.min(1, samples[i]));
                    int16Array[i] = sample * 0x7FFF;
                }
                
                // Initialize MP3 encoder
                const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // 1 channel, sample rate, 128kbps
                const mp3Data = [];
                
                // Encode in chunks
                let remaining = int16Array.length;
                let offset = 0;
                
                while (remaining >= sampleBlockSize) {
                    const chunk = int16Array.subarray(offset, offset + sampleBlockSize);
                    const mp3buf = mp3encoder.encodeBuffer(chunk);
                    if (mp3buf.length > 0) {
                        mp3Data.push(mp3buf);
                    }
                    remaining -= sampleBlockSize;
                    offset += sampleBlockSize;
                }
                
                // Encode remaining samples
                if (remaining > 0) {
                    const chunk = int16Array.subarray(offset);
                    const mp3buf = mp3encoder.encodeBuffer(chunk);
                    if (mp3buf.length > 0) {
                        mp3Data.push(mp3buf);
                    }
                }
                
                // Finalize encoding
                const finalMp3buf = mp3encoder.flush();
                if (finalMp3buf.length > 0) {
                    mp3Data.push(finalMp3buf);
                }
                
                // Create blob from MP3 data
                const blob = new Blob(mp3Data, { type: 'audio/mp3' });
                resolve(blob);
                
            } catch (error) {
                console.error('MP3 encoding error:', error);
                reject(error);
            }
        });
    }
}

// Initialize the encoder when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AudioEncoder();
});

// hPrevent file dropping on the page
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});