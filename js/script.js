document.addEventListener('DOMContentLoaded', () => {
    const sections = [...document.querySelectorAll('main .section[id]')];
    const navLinks = [...document.querySelectorAll('header nav a')];

    function showSection(targetId) {
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${targetId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
    }

    let photosLoaded = false;
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
            
            if (targetId === 'photos' && !photosLoaded) {
                const images = document.querySelectorAll('.photo-grid img[data-src]');
                images.forEach(img => {
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                });
                photosLoaded = true;
            }
        });
    });

    if (sections.length > 0) {
        showSection(sections[0].id);
    }

    const title = document.querySelector('h1');
    const originalText = 'plyght';
    const targetTexts = ['inaplight', 'pliiight'];
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

    title.addEventListener('mouseenter', () => {
        if (isAnimating) return;
        isAnimating = true;
        if (animationId) cancelAnimationFrame(animationId);
        currentTarget = targetTexts[Math.floor(Math.random() * targetTexts.length)];
        animate(currentTarget);
    });

    title.addEventListener('mouseleave', () => {
        if (isAnimating) return;
        isAnimating = true;
        if (animationId) cancelAnimationFrame(animationId);
        animate(originalText);
    });

    async function fetchGitHubStars(owner, repo) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.stargazers_count;
        } catch (error) {
            console.error(`Failed to fetch stars for ${repo}:`, error);
            return null;
        }
    }

    async function updateProjectStars() {
        const projects = [
            { name: 'spine', element: document.querySelector('a[href*="spine"]')?.closest('.publication')?.querySelector('.pub-meta') },
            { name: 'skew', element: document.querySelector('a[href*="skew"]')?.closest('.publication')?.querySelector('.pub-meta') },
            { name: 'VeRA', element: document.querySelector('a[href*="VeRA"]')?.closest('.publication')?.querySelector('.pub-meta') },
            { name: 'cedar', element: document.querySelector('a[href*="cedar"]')?.closest('.publication')?.querySelector('.pub-meta') }
        ];

        for (const project of projects) {
            if (!project.element) continue;
            
            const stars = await fetchGitHubStars('plyght', project.name);
            if (stars !== null) {
                project.element.textContent = `Rust · ${stars} ${stars === 1 ? 'star' : 'stars'}`;
            }
        }
    }

    updateProjectStars();

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
    if (window.innerWidth > 768 && main) {
        document.addEventListener('wheel', (e) => {
            if (!lightbox.classList.contains('active')) {
                e.preventDefault();
                main.scrollBy({ top: e.deltaY, behavior: 'auto' });
            }
        }, { passive: false });
    }
});
