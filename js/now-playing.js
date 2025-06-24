class NowPlaying {
    constructor() {
        console.log('NowPlaying constructor called');
        console.log('window.LASTFM_CONFIG:', window.LASTFM_CONFIG ? 'Found' : 'Not found');
        this.config = window.LASTFM_CONFIG || {};
        this.apiKey = this.config.apiKey || 'YOUR_API_KEY_HERE';
        this.username = this.config.username || 'YOUR_LASTFM_USERNAME';
        this.apiUrl = 'https://ws.audioscrobbler.com/2.0/';
        console.log('Config loaded - API key present:', !!this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE');
        console.log('Config loaded - Username present:', !!this.username && this.username !== 'YOUR_LASTFM_USERNAME');
        this.init();
    }

    async init() {
        console.log('Now Playing widget initializing...');
        console.log('API Key configured:', this.apiKey !== 'YOUR_API_KEY_HERE' ? 'Yes' : 'No');
        console.log('Username configured:', this.username !== 'YOUR_LASTFM_USERNAME' ? 'Yes' : 'No');
        
        if (this.apiKey === 'YOUR_API_KEY_HERE' || this.username === 'YOUR_LASTFM_USERNAME') {
            console.error('Configuration missing - API key or username not set');
            this.showError('Configuration needed');
            return;
        }
        
        console.log('Configuration valid, fetching now playing...');
        try {
            await this.fetchNowPlaying();
            setInterval(() => this.fetchNowPlaying(), 30000);
        } catch (error) {
            console.error('Failed to initialize now playing:', error);
            this.showError('Failed to load');
        }
    }

    async fetchNowPlaying() {
        const url = `${this.apiUrl}?method=user.getrecenttracks&user=${this.username}&api_key=${this.apiKey}&format=json&limit=1`;
        console.log('Fetching Last.fm data...');
        console.log('Request URL constructed (API key hidden):', url.replace(this.apiKey, '[HIDDEN]'));
        
        try {
            console.log('Making fetch request...');
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Last.fm data received:', data);
            this.updateDisplay(data);
        } catch (error) {
            console.error('Error fetching Last.fm data:', error);
            this.showError('Unable to load');
        }
    }

    updateDisplay(data) {
        const playingStatus = document.getElementById('playingStatus');
        const trackInfo = document.getElementById('trackInfo');
        const artistInfo = document.getElementById('artistInfo');
        const albumArt = document.getElementById('albumArt');

        if (!data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
            this.showError('No tracks found');
            return;
        }

        const track = data.recenttracks.track[0];
        const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
        
        playingStatus.textContent = isNowPlaying ? 'now playing' : 'last played';
        trackInfo.textContent = track.name || 'Unknown Track';
        artistInfo.textContent = track.artist['#text'] || track.artist || 'Unknown Artist';

        // Handle album artwork
        if (track.image && track.image.length > 0) {
            // Find the medium size image (index 1) or fallback to largest available
            const artwork = track.image.find(img => img.size === 'medium') || 
                           track.image.find(img => img.size === 'large') || 
                           track.image[track.image.length - 1];
            
            if (artwork && artwork['#text']) {
                albumArt.innerHTML = `<img src="${artwork['#text']}" alt="Album artwork" loading="lazy">`;
            } else {
                albumArt.innerHTML = '';
            }
        } else {
            albumArt.innerHTML = '';
        }

        const nowPlayingDiv = document.getElementById('nowPlaying');
        nowPlayingDiv.style.display = 'block';
    }

    showError(message) {
        const playingStatus = document.getElementById('playingStatus');
        const trackInfo = document.getElementById('trackInfo');
        const artistInfo = document.getElementById('artistInfo');
        const albumArt = document.getElementById('albumArt');
        
        playingStatus.textContent = message;
        trackInfo.textContent = '';
        artistInfo.textContent = '';
        albumArt.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NowPlaying();
});