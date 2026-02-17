class AudioManager {
    constructor() {
        this.audioReady = false;
        this.enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.scrambleSynth = null;
    }

    async initialize() {
        if (!this.enabled || this.audioReady) return;
        
        try {
            await Tone.start();
            
            this.scrambleSynth = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.002,
                    decay: 0.015,
                    sustain: 0,
                    release: 0.015
                },
                volume: -34
            }).toDestination();
            
            this.audioReady = true;
        } catch (error) {
            this.enabled = false;
        }
    }

    playScramble() {
        if (!this.enabled || !this.audioReady) return;
        
        try {
            const notes = ['E5', 'G5', 'B5', 'D5', 'F#5'];
            const timings = [0, 0.07, 0.15, 0.25, 0.37, 0.51, 0.67, 0.84, 0.98];
            const now = Tone.now();
            
            for (let i = 0; i < timings.length; i++) {
                const note = notes[Math.floor(Math.random() * notes.length)];
                const time = now + timings[i];
                this.scrambleSynth.triggerAttackRelease(note, '0.03', time);
            }
        } catch (error) {}
    }
}

class ColorSchemeGenerator {
    constructor() {
        this.harmonies = ['monochromatic', 'analogous', 'complementary', 'triadic', 'split-complementary'];
    }

    getLuminance(l, c, h) {
        const a = c * Math.cos(h * Math.PI / 180);
        const b = c * Math.sin(h * Math.PI / 180);
        
        const L = l + 0.3963377774 * a + 0.2158037573 * b;
        const M = l - 0.1055613458 * a - 0.0638541728 * b;
        const S = l - 0.0894841775 * a - 1.2914855480 * b;
        
        const l_ = L * L * L;
        const m_ = M * M * M;
        const s_ = S * S * S;
        
        let r = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
        let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
        let bval = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;
        
        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        bval = Math.max(0, Math.min(1, bval));
        
        const toLinear = (val) => {
            if (val <= 0.04045) return val / 12.92;
            return Math.pow((val + 0.055) / 1.055, 2.4);
        };
        
        const rLin = toLinear(r <= 0.0031308 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055);
        const gLin = toLinear(g <= 0.0031308 ? 12.92 * g : 1.055 * Math.pow(g, 1 / 2.4) - 0.055);
        const bLin = toLinear(bval <= 0.0031308 ? 12.92 * bval : 1.055 * Math.pow(bval, 1 / 2.4) - 0.055);
        
        return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
    }

    getContrast(color1, color2) {
        const lum1 = this.getLuminance(color1.l, color1.c, color1.h);
        const lum2 = this.getLuminance(color2.l, color2.c, color2.h);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    ensureContrast(bg, text, minContrast = 4.5) {
        let adjustedText = { ...text };
        let contrast = this.getContrast(bg, adjustedText);
        
        if (contrast >= minContrast) return adjustedText;
        
        const step = bg.l > 0.5 ? -0.05 : 0.05;
        for (let i = 0; i < 20; i++) {
            adjustedText.l += step;
            adjustedText.l = Math.max(0, Math.min(1, adjustedText.l));
            contrast = this.getContrast(bg, adjustedText);
            if (contrast >= minContrast) break;
        }
        
        return adjustedText;
    }

    oklchToRgb(l, c, h) {
        const a = c * Math.cos(h * Math.PI / 180);
        const b = c * Math.sin(h * Math.PI / 180);
        
        const L = l + 0.3963377774 * a + 0.2158037573 * b;
        const M = l - 0.1055613458 * a - 0.0638541728 * b;
        const S = l - 0.0894841775 * a - 1.2914855480 * b;
        
        const l_ = L * L * L;
        const m_ = M * M * M;
        const s_ = S * S * S;
        
        let r = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
        let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
        let bval = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;
        
        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        bval = Math.max(0, Math.min(1, bval));
        
        const toSrgb = (val) => {
            if (val <= 0.0031308) return 12.92 * val;
            return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
        };
        
        r = toSrgb(r);
        g = toSrgb(g);
        bval = toSrgb(bval);
        
        const toHex = (val) => Math.round(Math.max(0, Math.min(255, val * 255))).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(bval)}`;
    }

    generateScheme() {
        const baseHue = Math.floor(Math.random() * 360);
        const harmony = this.harmonies[Math.floor(Math.random() * this.harmonies.length)];
        
        let hues = [];
        switch(harmony) {
            case 'monochromatic':
                hues = [baseHue, baseHue, baseHue];
                break;
            case 'analogous':
                hues = [baseHue, (baseHue + 30) % 360, (baseHue - 30 + 360) % 360];
                break;
            case 'complementary':
                hues = [baseHue, (baseHue + 180) % 360, baseHue];
                break;
            case 'triadic':
                hues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
                break;
            case 'split-complementary':
                hues = [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360];
                break;
        }

        const baseChroma = 0.03 + Math.random() * 0.06;
        
        const lightBg = { l: 0.97, c: baseChroma * 0.3, h: hues[0] };
        const lightBgSecondary = { l: 0.99, c: baseChroma * 0.2, h: hues[0] };
        const lightTextRaw = { l: 0.25, c: baseChroma * 2, h: hues[1] };
        const lightTextSecondaryRaw = { l: 0.50, c: baseChroma * 1.5, h: hues[1] };
        
        const darkBg = { l: 0.18, c: baseChroma * 0.6, h: hues[0] };
        const darkBgSecondary = { l: 0.23, c: baseChroma * 0.5, h: hues[0] };
        const darkTextRaw = { l: 0.92, c: baseChroma * 0.8, h: hues[1] };
        const darkTextSecondaryRaw = { l: 0.68, c: baseChroma * 1.2, h: hues[1] };
        
        const scheme = {
            light: {
                bgPrimary: lightBg,
                bgSecondary: lightBgSecondary,
                textPrimary: this.ensureContrast(lightBg, lightTextRaw, 7),
                textSecondary: this.ensureContrast(lightBg, lightTextSecondaryRaw, 4.5),
                borderColor: { l: 0.88, c: baseChroma * 0.6, h: hues[0] },
                accentColor: this.ensureContrast(lightBg, { l: 0.30, c: baseChroma * 2.5, h: hues[2] }, 4.5)
            },
            dark: {
                bgPrimary: darkBg,
                bgSecondary: darkBgSecondary,
                textPrimary: this.ensureContrast(darkBg, darkTextRaw, 7),
                textSecondary: this.ensureContrast(darkBg, darkTextSecondaryRaw, 4.5),
                borderColor: { l: 0.32, c: baseChroma * 0.8, h: hues[0] },
                accentColor: this.ensureContrast(darkBg, { l: 0.82, c: baseChroma * 1.5, h: hues[2] }, 4.5)
            }
        };

        return scheme;
    }

    applyScheme(scheme) {
        const root = document.documentElement;
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const colors = isDark ? scheme.dark : scheme.light;

        const setColor = (prop, color) => {
            const hex = this.oklchToRgb(color.l, color.c, color.h);
            const oklch = `oklch(${color.l} ${color.c} ${color.h})`;
            root.style.setProperty(prop, oklch);
            root.style.setProperty(`${prop}-fallback`, hex);
        };

        setColor('--bg-primary', colors.bgPrimary);
        setColor('--bg-secondary', colors.bgSecondary);
        setColor('--text-primary', colors.textPrimary);
        setColor('--text-secondary', colors.textSecondary);
        setColor('--border-color', colors.borderColor);
        setColor('--accent-color', colors.accentColor);

        const bars = document.querySelectorAll('.np-bar');
        const accentOklch = `oklch(${colors.accentColor.l} ${colors.accentColor.c} ${colors.accentColor.h})`;
        const textOklch = `oklch(${colors.textPrimary.l} ${colors.textPrimary.c} ${colors.textPrimary.h})`;
        bars.forEach(bar => {
            bar.style.setProperty('--bar-color-1', accentOklch);
            bar.style.setProperty('--bar-color-2', textOklch);
        });

        this.currentScheme = scheme;
    }

    getDefaultScheme() {
        return {
            light: {
                bgPrimary: { l: 0.98, c: 0, h: 0 },
                bgSecondary: { l: 1.0, c: 0, h: 0 },
                textPrimary: { l: 0.15, c: 0, h: 0 },
                textSecondary: { l: 0.40, c: 0, h: 0 },
                borderColor: { l: 0.90, c: 0, h: 0 },
                accentColor: { l: 0.20, c: 0, h: 0 }
            },
            dark: {
                bgPrimary: { l: 0.10, c: 0, h: 0 },
                bgSecondary: { l: 0.15, c: 0, h: 0 },
                textPrimary: { l: 0.98, c: 0, h: 0 },
                textSecondary: { l: 0.64, c: 0, h: 0 },
                borderColor: { l: 0.20, c: 0, h: 0 },
                accentColor: { l: 0.90, c: 0, h: 0 }
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const audioManager = new AudioManager();
    let audioInitialized = false;

    const ensureAudio = async () => {
        if (!audioInitialized) {
            await audioManager.initialize();
            audioInitialized = true;
        }
    };

    const sections = [...document.querySelectorAll('main .section[id]')];
    const navLinks = [...document.querySelectorAll('header nav a[href^="/"]')];
    const sectionIds = sections.map(s => s.id);

    function pathToSection(path) {
        var id = path.replace(/^\/|\/$/g, '');
        return sectionIds.indexOf(id) !== -1 ? id : sectionIds[0];
    }

    function showSection(targetId, push) {
        sections.forEach(function (section) {
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        navLinks.forEach(function (link) {
            if (pathToSection(link.getAttribute('href')) === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        if (push) {
            history.pushState({ section: targetId }, '', '/' + targetId + '/');
        }

        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
    }

    let photosLoaded = false;

    function loadPhotos() {
        if (photosLoaded) return;
        var images = document.querySelectorAll('.photo-grid img[data-src]');
        images.forEach(function (img) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
        photosLoaded = true;
    }

    const photosSection = document.getElementById('photos');
    if (photosSection) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    loadPhotos();
                    observer.disconnect();
                }
            });
        }, { rootMargin: '200px' });
        observer.observe(photosSection);
    }

    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var targetId = pathToSection(link.getAttribute('href'));

            if (window.innerWidth <= 768) {
                var targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                    navLinks.forEach(function (l) { l.classList.remove('active'); });
                    link.classList.add('active');
                }
            } else {
                showSection(targetId, true);
            }

            if (targetId === 'photos') loadPhotos();
        });
    });

    var initialSection = pathToSection(location.pathname);
    showSection(initialSection, false);

    if (window.innerWidth <= 768 && initialSection !== sectionIds[0]) {
        var el = document.getElementById(initialSection);
        if (el) setTimeout(function () { el.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }

    window.addEventListener('popstate', function () {
        showSection(pathToSection(location.pathname), false);
    });

    const title = document.querySelector('h1');
    const originalText = 'plyght';
    const targetTexts = ['inaplight', 'pliiight', 'plyght'];
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let isAnimating = false;
    let currentTarget = '';
    let animationId = null;
    let lastUpdate = 0;

    function scramble(text, progress, seed) {
        return text.split('').map((char, i) => {
            const charProgress = progress - (i * 0.6);
            if (charProgress >= 2.5) {
                return text[i];
            }
            if (charProgress > 0) {
                const index = Math.floor((seed + i * 3) * 7) % chars.length;
                return chars[index];
            }
            const index = Math.floor((seed + i * 5) * 11) % chars.length;
            return text[i] === ' ' ? ' ' : chars[index];
        }).join('');
    }

    function animate(text, onComplete) {
        const startTime = performance.now();
        const duration = 1100;
        let scrambleSeed = 0;
        title.classList.add('scrambling');

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = (elapsed / duration) * text.length * 0.6;

            if (currentTime - lastUpdate > 41.67) {
                scrambleSeed = Math.random();
                lastUpdate = currentTime;
            }

            title.textContent = scramble(text, progress, scrambleSeed);

            if (elapsed < duration) {
                animationId = requestAnimationFrame(step);
            } else {
                title.textContent = text;
                setTimeout(() => {
                    title.classList.remove('scrambling');
                    isAnimating = false;
                    if (onComplete) onComplete();
                }, 100);
            }
        }

        animationId = requestAnimationFrame(step);
    }

    title.addEventListener('mouseenter', async () => {
        if (isAnimating) return;
        
        isAnimating = true;
        if (animationId) cancelAnimationFrame(animationId);
        
        let newTarget;
        const availableTexts = targetTexts.filter(t => t !== title.textContent);
        newTarget = availableTexts[Math.floor(Math.random() * availableTexts.length)];
        currentTarget = newTarget;
        
        animate(currentTarget);
        
        await ensureAudio();
        audioManager.playScramble();
    });

    class GitHubStarsManager {
        constructor() {
            this.cacheKey = 'gh_stars_cache';
            this.cacheExpiry = 5 * 60 * 1000;
            this.pollInterval = 5 * 60 * 1000;
            this.owner = 'plyght';
        }

        getCache() {
            try {
                const cached = localStorage.getItem(this.cacheKey);
                if (!cached) return null;
                
                const data = JSON.parse(cached);
                const now = Date.now();
                
                if (now - data.timestamp < this.cacheExpiry) {
                    return data.stars;
                }
                
                return null;
            } catch (error) {
                return null;
            }
        }

        setCache(stars) {
            try {
                const data = {
                    stars,
                    timestamp: Date.now()
                };
                localStorage.setItem(this.cacheKey, JSON.stringify(data));
            } catch (error) {}
        }

        async fetchStars(repo) {
            try {
                const response = await fetch(`https://api.github.com/repos/${this.owner}/${repo}`);
                if (!response.ok) return null;
                const data = await response.json();
                return data.stargazers_count;
            } catch (error) {
                return null;
            }
        }

        async updateStars(projects, forceUpdate = false) {
            const cached = forceUpdate ? null : this.getCache();
            const updatedCache = { ...cached } || {};
            
            for (const project of projects) {
                if (!project.element) continue;
                
                const cachedStars = cached?.[project.name];
                if (cachedStars !== undefined && !forceUpdate) {
                    this.updateElement(project.element, cachedStars, project.language);
                    continue;
                }
                
                const stars = await this.fetchStars(project.name);
                if (stars !== null) {
                    this.updateElement(project.element, stars, project.language);
                    updatedCache[project.name] = stars;
                }
            }
            
            if (Object.keys(updatedCache).length > 0) {
                this.setCache(updatedCache);
            }
        }

        updateElement(element, stars, language) {
            const newText = `${language} · ${stars} ${stars === 1 ? 'star' : 'stars'}`;
            if (element.textContent !== newText) {
                element.textContent = newText;
            }
        }

        async pollStars(projects) {
            const cached = this.getCache() || {};
            let hasChanges = false;
            
            for (const project of projects) {
                if (!project.element) continue;
                
                const stars = await this.fetchStars(project.name);
                if (stars !== null && stars !== cached[project.name]) {
                    this.updateElement(project.element, stars, project.language);
                    cached[project.name] = stars;
                    hasChanges = true;
                }
            }
            
            if (hasChanges) {
                this.setCache(cached);
            }
        }

        startPolling(projects) {
            setInterval(() => {
                this.pollStars(projects);
            }, this.pollInterval);
        }
    }

    const starsManager = new GitHubStarsManager();
    const projects = [
        { name: 'spine', language: 'Rust', element: document.querySelector('a[href*="spine"]')?.closest('.publication')?.querySelector('.pub-meta') },
        { name: 'skew', language: 'Rust', element: document.querySelector('a[href*="skew"]')?.closest('.publication')?.querySelector('.pub-meta') },
        { name: 'anchor', language: 'TypeScript', element: document.querySelector('a[href*="anchor"]')?.closest('.publication')?.querySelector('.pub-meta') },
        { name: 'wax', language: 'Rust', element: document.querySelector('a[href*="wax"]')?.closest('.publication')?.querySelector('.pub-meta') }
    ];

    starsManager.updateStars(projects);
    starsManager.startPolling(projects);

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('img');
    const photoGrid = document.querySelector('.photo-grid');

    if (photoGrid) {
        photoGrid.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                lightboxImg.src = e.target.src;
                lightbox.classList.add('active');
                const widget = document.querySelector('.np-widget');
                if (widget) widget.classList.add('hidden');
            }
        });
    }

    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
        const widget = document.querySelector('.np-widget');
        if (widget) widget.classList.remove('hidden');
    });

    const main = document.querySelector('main');
    if (main) {
        document.addEventListener('wheel', (e) => {
            if (window.innerWidth > 768 && !lightbox.classList.contains('active')) {
                e.preventDefault();
                main.scrollBy({ top: e.deltaY, behavior: 'auto' });
            }
        }, { passive: false });
    }

    const colorGen = new ColorSchemeGenerator();
    colorGen.applyScheme(colorGen.getDefaultScheme());

    const colorschemeBtn = document.getElementById('colorschemeBtn');
    if (colorschemeBtn) {
        colorschemeBtn.addEventListener('click', () => {
            const newScheme = colorGen.generateScheme();
            colorGen.applyScheme(newScheme);
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (colorGen.currentScheme) {
            colorGen.applyScheme(colorGen.currentScheme);
        }
    });

    let isScrolling = false;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        isScrolling = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        if (Math.abs(touchY - touchStartY) > 10) {
            isScrolling = true;
        }
    }, { passive: true });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !isScrolling) {
            const target = e.target;
            const isInteractive = target.closest('a, button, input, textarea, select, img, [role="button"]');
            const isLightbox = target.closest('#lightbox');
            const lightboxActive = lightbox?.classList.contains('active');
            
            if (!isInteractive && !isLightbox && !lightboxActive) {
                const newScheme = colorGen.generateScheme();
                colorGen.applyScheme(newScheme);
            }
        }
    });


});
