class NowPlayingWidget {
    constructor() {
        this.config = window.LASTFM_CONFIG || {};
        this.apiKey = this.config.apiKey || 'YOUR_API_KEY_HERE';
        this.username = this.config.username || 'YOUR_LASTFM_USERNAME';
        this.apiUrl = 'https://ws.audioscrobbler.com/2.0/';
        this.lastTrackData = null;
        this.isFetching = false;
        this.createWidget();
        
        this.widget = document.getElementById('nowPlayingWidget');
        this.expandedEl = this.widget.querySelector('.np-expanded');
        this.collapsedWidth = 56;
        this.isExpanded = false;
        
        this.loadSavedColors();
        this.restoreSavedTrack();
        
        this.isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        if (!this.isMobile) {
            this.widget.style.width = `${this.collapsedWidth}px`;
        }
        
        if (!this.isMobile) {
            this.widget.addEventListener('mouseenter', () => this.expand());
            this.widget.addEventListener('mouseleave', () => this.collapse());
            
            this.widget.addEventListener('touchstart', () => this.expand(), { passive: true });
            document.addEventListener('touchend', (e) => {
                if (this.isExpanded && !this.widget.contains(e.target)) this.collapse();
            });
        }
        
        window.addEventListener('resize', () => {
            this.isMobile = window.matchMedia('(max-width: 768px)').matches;
            if (this.isMobile) {
                this.widget.classList.remove('is-open');
                this.isExpanded = false;
                this.expand(true);
                return;
            }
            if (!this.isExpanded) {
                this.widget.style.width = `${this.collapsedWidth}px`;
            } else {
                this.expand(true);
            }
        });
        
        this.init();
    }

    loadSavedColors() {
        const savedColors = localStorage.getItem('npWidgetColors');
        if (savedColors) {
            const colors = JSON.parse(savedColors);
            const bars = document.querySelectorAll('.np-bar');
            bars.forEach(bar => {
                bar.style.setProperty('--bar-color-1', colors[0]);
                bar.style.setProperty('--bar-color-2', colors[1]);
            });
        }
    }

    restoreSavedTrack() {
        const savedTrack = localStorage.getItem('npWidgetTrack');
        if (!savedTrack) {
            return;
        }

        try {
            const data = JSON.parse(savedTrack);
            if (!data || typeof data !== 'object') {
                return;
            }

            const track = document.getElementById('npTrack');
            const artist = document.getElementById('npArtist');
            const albumArt = document.getElementById('npAlbumArt');

            const trackName = typeof data.trackName === 'string' ? data.trackName : null;
            const artistName = typeof data.artistName === 'string' ? data.artistName : null;
            const imageUrl = typeof data.imageUrl === 'string' && data.imageUrl.trim() ? data.imageUrl : null;
            const trackId = typeof data.trackId === 'string' ? data.trackId : null;

            if (track) {
                track.textContent = trackName || 'Unknown Track';
            }
            if (artist) {
                artist.textContent = artistName || 'Unknown Artist';
            }
            if (albumArt) {
                albumArt.innerHTML = imageUrl ? `<img src="${imageUrl}" alt="Album artwork">` : '';
            }

            this.lastTrackData = {
                trackId,
                trackName: track ? track.textContent || null : trackName,
                artistName: artist ? artist.textContent || null : artistName,
                imageUrl: imageUrl || null
            };
        } catch (error) {
            localStorage.removeItem('npWidgetTrack');
            console.error('Failed to restore track data:', error);
        }
    }

    saveColors(colors) {
        localStorage.setItem('npWidgetColors', JSON.stringify(colors));
    }

    saveTrackData(data) {
        localStorage.setItem('npWidgetTrack', JSON.stringify(data));
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.id = 'nowPlayingWidget';
        widget.className = 'np-widget';
        widget.innerHTML = `
            <div class="np-circle">
                <div class="np-equalizer">
                    <div class="np-bar"></div>
                    <div class="np-bar"></div>
                    <div class="np-bar"></div>
                    <div class="np-bar"></div>
                </div>
            </div>
            <div class="np-expanded">
                <div class="np-album-art" id="npAlbumArt"></div>
                <div class="np-info">
                    <div class="np-track" id="npTrack"></div>
                    <div class="np-artist" id="npArtist"></div>
                </div>
            </div>
        `;
        document.body.appendChild(widget);
    }

    async init() {
        if (this.apiKey === 'YOUR_API_KEY_HERE' || this.username === 'YOUR_LASTFM_USERNAME') {
            return;
        }
        
        try {
            await this.fetchNowPlaying();
            setInterval(() => this.fetchNowPlaying(), 10000);
        } catch (error) {
            console.error('Failed to load:', error);
        }
    }

    extractColors(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                let r = 0, g = 0, b = 0;
                let count = 0;
                
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
                
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);
                
                const color1 = `rgb(${r}, ${g}, ${b})`;
                const color2 = `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;
                
                resolve([color1, color2]);
            };
            img.onerror = () => resolve(['#1a73e8', '#0d47a1']);
            img.src = imageUrl;
        });
    }

    async fetchNowPlaying() {
        if (this.isFetching) {
            return;
        }

        this.isFetching = true;

        const url = `${this.apiUrl}?method=user.getrecenttracks&user=${this.username}&api_key=${this.apiKey}&format=json&limit=1`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            await this.updateDisplay(data);
        } catch (error) {
            console.error('Error fetching Last.fm data:', error);
        } finally {
            this.isFetching = false;
        }
    }

    async updateDisplay(data) {
        const albumArt = document.getElementById('npAlbumArt');
        const track = document.getElementById('npTrack');
        const artist = document.getElementById('npArtist');
        const bars = document.querySelectorAll('.np-bar');

        if (!data.recenttracks || !Array.isArray(data.recenttracks.track) || data.recenttracks.track.length === 0) {
            return;
        }

        const trackData = data.recenttracks.track[0];
        const isNowPlaying = trackData['@attr'] && trackData['@attr'].nowplaying === 'true';

        bars.forEach(bar => {
            if (isNowPlaying) {
                bar.classList.remove('paused');
            } else {
                bar.classList.add('paused');
            }
        });

        const rawTrackName = typeof trackData.name === 'string' ? trackData.name.trim() : '';
        const artistField = trackData.artist || {};
        const rawArtistName = typeof artistField === 'string'
            ? artistField.trim()
            : typeof artistField['#text'] === 'string'
                ? artistField['#text'].trim()
                : '';
        const artworkList = Array.isArray(trackData.image) ? trackData.image : [];
        const artwork = artworkList.find(img => img.size === 'extralarge') ||
                        artworkList.find(img => img.size === 'large') ||
                        artworkList.find(img => img.size === 'medium') ||
                        artworkList[artworkList.length - 1];
        const artworkUrl = artwork && typeof artwork['#text'] === 'string' ? artwork['#text'].trim() : '';

        const trackId = typeof trackData.mbid === 'string' && trackData.mbid.trim()
            ? trackData.mbid.trim()
            : (rawArtistName && rawTrackName ? `${rawArtistName.toLowerCase()}::${rawTrackName.toLowerCase()}` : null);

        const normalizedTrack = {
            trackId,
            trackName: rawTrackName || null,
            artistName: rawArtistName || null,
            imageUrl: artworkUrl || null
        };

        const previousData = this.lastTrackData;
        const hasIncomingDetails = normalizedTrack.trackId || normalizedTrack.trackName || normalizedTrack.artistName;

        if (!hasIncomingDetails && !previousData) {
            return;
        }

        const sameTrack = previousData
            ? (normalizedTrack.trackId && previousData.trackId
                ? normalizedTrack.trackId === previousData.trackId
                : normalizedTrack.trackName === previousData.trackName && normalizedTrack.artistName === previousData.artistName)
            : false;

        const trackChanged = !previousData || !sameTrack;

        const displayTrackName = normalizedTrack.trackName || previousData?.trackName || 'Unknown Track';
        const displayArtistName = normalizedTrack.artistName || previousData?.artistName || 'Unknown Artist';

        if (track.textContent !== displayTrackName) {
            track.textContent = displayTrackName;
        }
        if (artist.textContent !== displayArtistName) {
            artist.textContent = displayArtistName;
        }

        const previousImageUrl = previousData ? previousData.imageUrl : null;
        const shouldReplaceArt = trackChanged
            ? normalizedTrack.imageUrl !== previousImageUrl
            : (normalizedTrack.imageUrl && normalizedTrack.imageUrl !== previousImageUrl);

        if (trackChanged && !normalizedTrack.imageUrl) {
            if (albumArt.innerHTML !== '') {
                albumArt.innerHTML = '';
            }
        } else if (normalizedTrack.imageUrl && (shouldReplaceArt || !albumArt.firstElementChild)) {
            if (!albumArt.firstElementChild || albumArt.firstElementChild.getAttribute('src') !== normalizedTrack.imageUrl) {
                albumArt.innerHTML = `<img src="${normalizedTrack.imageUrl}" alt="Album artwork">`;
            }
            const colors = await this.extractColors(normalizedTrack.imageUrl);
            this.saveColors(colors);
            bars.forEach(bar => {
                bar.style.setProperty('--bar-color-1', colors[0]);
                bar.style.setProperty('--bar-color-2', colors[1]);
            });
        }

        const displayedImage = albumArt.querySelector('img');
        const displayedData = {
            trackId: normalizedTrack.trackId !== null ? normalizedTrack.trackId : (trackChanged ? null : previousData?.trackId || null),
            trackName: track.textContent || null,
            artistName: artist.textContent || null,
            imageUrl: displayedImage ? displayedImage.getAttribute('src') : null
        };

        if (!previousData ||
            displayedData.trackId !== previousData.trackId ||
            displayedData.trackName !== previousData.trackName ||
            displayedData.artistName !== previousData.artistName ||
            displayedData.imageUrl !== previousData.imageUrl) {
            this.lastTrackData = displayedData;
            this.saveTrackData(displayedData);
        }

        if (this.isMobile || this.isExpanded) {
            this.expand(true);
        }
    }

    expand(forceRecalc = false) {
        if (!forceRecalc && this.isExpanded && !this.isMobile) return;

        const track = this.expandedEl.querySelector('.np-track');
        const artist = this.expandedEl.querySelector('.np-artist');
        
        const measureElement = document.createElement('div');
        measureElement.style.position = 'absolute';
        measureElement.style.visibility = 'hidden';
        measureElement.style.whiteSpace = 'nowrap';
        measureElement.style.pointerEvents = 'none';
        document.body.appendChild(measureElement);
        
        const trackStyles = window.getComputedStyle(track);
        measureElement.style.fontFamily = trackStyles.fontFamily;
        measureElement.style.fontSize = trackStyles.fontSize;
        measureElement.style.fontWeight = trackStyles.fontWeight;
        measureElement.style.letterSpacing = trackStyles.letterSpacing;
        measureElement.textContent = track.textContent;
        const trackWidth = Math.ceil(measureElement.getBoundingClientRect().width);
        
        const artistStyles = window.getComputedStyle(artist);
        measureElement.style.fontFamily = artistStyles.fontFamily;
        measureElement.style.fontSize = artistStyles.fontSize;
        measureElement.style.fontWeight = artistStyles.fontWeight;
        measureElement.style.fontStyle = artistStyles.fontStyle;
        measureElement.style.letterSpacing = artistStyles.letterSpacing;
        measureElement.textContent = artist.textContent;
        const artistWidth = Math.ceil(measureElement.getBoundingClientRect().width);
        
        document.body.removeChild(measureElement);
        
        const maxTextWidth = Math.max(trackWidth, artistWidth);
        
        if (this.isMobile) {
            const albumArtWidth = 36;
            const gapWidth = 12;
            const paddingX = 24;
            const maxMobileWidth = window.innerWidth - 24;
            
            let target = paddingX + albumArtWidth + gapWidth + maxTextWidth + 8;
            target = Math.min(target, maxMobileWidth);
            
            this.widget.style.width = `${target}px`;
        } else {
            const albumArtWidth = 44;
            const gapWidth = 12;
            const paddingX = 32;
            const maxWidth = Math.floor(window.innerWidth * 0.9);
            
            let target = paddingX + albumArtWidth + gapWidth + maxTextWidth + 4;
            target = Math.min(target, maxWidth);

            this.widget.classList.add('is-open');
            this.widget.style.width = `${target}px`;
            this.isExpanded = true;
        }
    }

    collapse() {
        if (this.isMobile) return;
        if (!this.isExpanded) return;
        this.widget.style.width = `${this.collapsedWidth}px`;
        this.widget.classList.remove('is-open');
        this.isExpanded = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NowPlayingWidget();
});
