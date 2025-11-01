// scripts.js — improved preview handling with clear errors & fallbacks
(async function() {
    // helper: show a message in preview area
    function showPreviewMessage(html) {
        const preview = document.getElementById('preview-area');
        if (preview) preview.innerHTML = `<div class="preview-msg">${html}</div>`;
    }

    // Load projects.json
    let projects = [];
    try {
        const res = await fetch('projects.json');
        projects = await res.json();
    } catch (err) {
        console.error('Failed to load projects.json:', err);
        const grid = document.getElementById('project-grid');
        if (grid) grid.innerHTML = '<p style="color:#c00">Could not load projects.json — check that file exists and you are serving the site over HTTP (not file://).</p>';
        return;
    }

    // populate grid
    const gridTargets = document.querySelectorAll('#project-grid');
    gridTargets.forEach(grid => {
        projects.forEach(p => {
            const el = document.createElement('div');
            el.className = 'card';
            el.innerHTML = `
        <img src="${p.thumbnail}" alt="${p.title} thumbnail"/>
        <h4 class="project-title">${p.title}</h4>
        <p class="muted">${p.summary}</p>
        <p><strong>Techniques:</strong> ${p.techniques.join(', ')}</p>
        <div style="margin-top:10px">
          <button class="cta view-btn" data-id="${p.id}">View Project</button>
          <a class="cta outline" href="${p.hosted_file}" download style="margin-left:8px">Download</a>
        </div>
      `;
            grid.appendChild(el);
        });
    });

    // modal elements
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    const modalTitle = document.getElementById('modal-title');

    // click handler (delegated)
    document.body.addEventListener('click', async(e) => {
        const viewBtn = e.target.closest('.view-btn');
        if (viewBtn) {
            const id = viewBtn.getAttribute('data-id');
            const p = projects.find(x => x.id === id);
            if (!p) return console.error('Project not found for id', id);

            // open modal
            modal.setAttribute('aria-hidden', 'false');
            modalTitle.textContent = p.title;
            modalBody.innerHTML = `<p>${p.summary}</p><p><strong>Techniques:</strong> ${p.techniques.join(', ')}</p>
                             <div id="preview-area" style="margin-top:1rem; min-height:220px;">Preparing preview…</div>`;

            // footer links
            modalFooter.innerHTML = `
        <a class="cta outline" href="${p.google_drive || '#'}" target="_blank" rel="noopener">View in Google Drive</a>
        <a class="cta outline" href="${p.dropbox || '#'}" target="_blank" rel="noopener" style="margin-left:8px">View in Dropbox</a>
        <a class="cta" href="${p.hosted_file}" download style="margin-left:8px">Download .xlsx</a>
      `;

            // if user opened site as file://, fetching local files will fail in many browsers
            if (window.location.protocol === 'file:') {
                showPreviewMessage('Preview unavailable when opening the site via <code>file://</code>. Please serve the folder via a local server (easy option below).');
                return;
            }

            // attempt to fetch hosted file and render via SheetJS
            const previewArea = document.getElementById('preview-area');
            if (!previewArea) return;

            try {
                showPreviewMessage('Loading workbook… (this may take a second)');
                const resp = await fetch(p.hosted_file);
                if (!resp.ok) {
                    // likely file not found or forbidden
                    console.warn('Fetch returned non-OK:', resp.status, resp.statusText);
                    throw new Error(`Unable to fetch file (status ${resp.status})`);
                }

                const ab = await resp.arrayBuffer();
                // parse with XLSX:
                const workbook = XLSX.read(ab, { type: 'array' });
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error('Workbook has no sheets');
                }
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const html = XLSX.utils.sheet_to_html(firstSheet, { id: "sheet-preview", editable: false });

                // wrap in container that allows internal overflow and keeps modal scroll intact
                previewArea.innerHTML = `<div class="sheet-container" style="overflow:hidden; max-height:60vh;">${html}</div>`;

                // optional: tidy up table styles a bit for readability
                const tbl = previewArea.querySelector('#sheet-preview table');
                if (tbl) {
                    tbl.style.borderCollapse = 'collapse';
                    tbl.style.width = '100%';
                }
            } catch (err) {
                console.error('Preview error:', err);
                // fallback: if cloud link available, suggest using it. Otherwise show helpful instructions.
                if (p.google_drive || p.dropbox) {
                    showPreviewMessage('Could not render local preview — try the cloud preview links above (Google Drive / Dropbox).');
                } else {
                    showPreviewMessage('Preview not available. Ensure you are serving the site over HTTP and that the file path in projects.json (hosted_file) is correct. Check the console for details.');
                }
            }
        }

        // close modal: close button or backdrop click
        if (e.target.closest('.modal-close') || e.target === modal) {
            modal.setAttribute('aria-hidden', 'true');
            modalBody.innerHTML = '';
            modalFooter.innerHTML = '';
        }
    });


    // THEME TOGGLE (unchanged)
    const themeToggle = document.getElementById('theme-toggle');
    const setTheme = (theme) => {
        if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', theme);
        if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    };
    const saved = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(saved);
    if (themeToggle) themeToggle.addEventListener('click', () => setTheme(localStorage.getItem('theme') === 'dark' ? 'light' : 'dark'));


    // CONTACT FORM (unchanged)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            const msg = document.getElementById('contact-msg');
            if (msg) { msg.classList.remove('hidden');
                msg.textContent = 'Sending…'; }
            const fd = new FormData(contactForm);
            try {
                const res = await fetch(contactForm.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } });
                if (res.ok) { if (msg) msg.textContent = 'Thank you — message sent!';
                    contactForm.reset(); } else { if (msg) msg.textContent = 'There was a problem sending the message.'; }
            } catch (err) { if (msg) msg.textContent = 'Network error. Try emailing directly.'; }
        });
    }

})();