(function () {
    var sectionPaths = ['/about/', '/work/', '/projects/', '/photos/', '/contact/', '/'];
    var prefetched = {};

    function isSectionLink(link) {
        return sectionPaths.indexOf(link.pathname) !== -1;
    }

    document.addEventListener('mouseover', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        if (link.hostname !== location.hostname) return;
        if (isSectionLink(link)) return;
        if (prefetched[link.pathname]) return;

        prefetched[link.pathname] = true;
        var hint = document.createElement('link');
        hint.rel = 'prefetch';
        hint.href = link.href;
        document.head.appendChild(hint);
    });

    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        if (link.hostname !== location.hostname) return;
        if (isSectionLink(link)) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (link.hasAttribute('target')) return;

        e.preventDefault();
        var href = link.href;

        document.documentElement.classList.add('page-leaving');

        setTimeout(function () {
            window.location.href = href;
        }, 180);
    });

    window.addEventListener('pageshow', function () {
        document.documentElement.classList.remove('page-leaving');
    });
})();
