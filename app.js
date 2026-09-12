// HIGH CAPACITY HYMN INDEX DATA STORAGE UNIT
const hymnDatabase = [
    { number: 1, title: "Abide, O Dearest Jesus", page: 5 },
    { number: 2, title: "Abide With Me", page: 7 },
    { number: 3, title: "A Child Is Born In Bethlehem", page: 9 },
    { number: 4, title: "A Great and Mighty Wonder", page: 11 },
    { number: 5, title: "All Praise To Thee, My God, This Night", page: 12 },
    { number: 6, title: "Alas! And Did My Savior Bleed", page: 13 },
    { number: 7, title: "Alleluia, Sing to Jesus", page: 14 },
    { number: 10, title: "All Creatures of Our God and King", page: 17 },
    { number: 11, title: "All From Sheba's Island Coming", page: 19 },
    { number: 12, title: "All Glory, Laud, and Honor", page: 21 },
    { number: 14, title: "All My Heart This Night Rejoices", page: 24 },
    { number: 15, title: "All People That On Earth Do Dwell", page: 26 },
    { number: 20, title: "All Praise to Thee, Eternal Lord", page: 32 },
    { number: 25, title: "Amazing Grace", page: 38 },
    { number: 30, title: "Angels We Have Heard On High", page: 44 },
    { number: 31, title: "Angels From the Realms of Glory", page: 45 },
    { number: 35, title: "As With Gladness Men of Old", page: 50 },
    { number: 36, title: "Be Still My Soul", page: 51 },
    { number: 37, title: "Be Thou My Vision", page: 53 },
    { number: 40, title: "Beautiful Savior", page: 57 },
    { number: 45, title: "Beneath the Cross of Jesus", page: 63 },
    { number: 50, title: "Blessed Assurance", page: 71 },
    { number: 55, title: "Blest Be the Tie That Binds", page: 77 },
    { number: 60, title: "Christ the Lord Is Risen Today", page: 83 },
    { number: 65, title: "Come, Thou Almighty King", page: 90 },
    { number: 70, title: "Come, Thou Long Expected Jesus", page: 97 },
    { number: 75, title: "Crown Him With Many Crowns", page: 104 }
];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cloudflare.com';
let pdfDoc = null;
let activeHymn = null;
let activePage = 1;
let bookmarks = JSON.parse(localStorage.getItem('hymn_bookmarks')) || [];

function switchTab(tabId) {
    ['home', 'search', 'contents', 'favorites'].forEach(view => {
        document.getElementById(`view-${view}`).classList.add('hidden');
        document.getElementById(`nav-${view}`).className = "px-5 py-2 rounded-full transition text-[#5C4D46] hover:bg-[#EADFCF]";
    });
    document.getElementById(`view-${tabId}`).classList.remove('hidden');
    document.getElementById(`nav-${tabId}`).className = "px-5 py-2 rounded-full transition brand-bg text-white shadow-sm";
    if(tabId === 'contents') renderContents('alpha');
    if(tabId === 'favorites') renderFavoritesView();
}

function renderContents(mode) {
    const grid = document.getElementById('contentsGrid');
    const btnAlpha = document.getElementById('sort-alpha');
    const btnNum = document.getElementById('sort-num');
    grid.innerHTML = "";

    if (mode === 'alpha') {
        btnAlpha.className = "px-4 py-1.5 rounded-lg bg-white shadow-sm brand-text";
        btnNum.className = "px-4 py-1.5 rounded-lg text-[#5C4D46]";
        
        const sorted = [...hymnDatabase].sort((a,b) => a.title.localeCompare(b.title));
        const groups = {};
        sorted.forEach(hymn => {
            const firstLetter = hymn.title.charAt(0).toUpperCase();
            if (!groups[firstLetter]) groups[firstLetter] = [];
            groups[firstLetter].push(hymn);
        });

        for (let letter in groups) {
            let section = document.createElement('div');
            section.className = "flex flex-col gap-3";
            section.innerHTML = `
                <div class="serif-title text-xl font-bold brand-text border-b border-[#E8DFD3] pb-1 w-12 text-center bg-[#F3EBE0] rounded-lg">${letter}</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">${groups[letter].map(h => renderHymnRowCard(h)).join('')}</div>
            `;
            grid.appendChild(section);
        }
    } else {
        btnNum.className = "px-4 py-1.5 rounded-lg bg-white shadow-sm brand-text";
        btnAlpha.className = "px-4 py-1.5 rounded-lg text-[#5C4D46]";

        const sorted = [...hymnDatabase].sort((a,b) => a.number - b.number);
        let section = document.createElement('div');
        section.className = "grid grid-cols-1 md:grid-cols-2 gap-3";
        section.innerHTML = sorted.map(h => renderHymnRowCard(h)).join('');
        grid.appendChild(section);
    }
}

function renderHymnRowCard(hymn) {
    return `
        <div onclick="openHymnSheet(${hymn.number})" class="bg-white border border-[#E8DFD3] p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#5C1D24]/40 hover:shadow-sm transition active:scale-[0.99]">
            <div class="flex items-center gap-4 min-w-0">
                <span class="font-mono font-bold brand-text text-base w-8">${hymn.number}</span>
                <span class="font-medium text-[#2D221E] truncate pr-2">${hymn.title}</span>
            </div>
            <span class="text-xs font-mono opacity-40 shrink-0">p. ${hymn.page}</span>
        </div>
    `;
}

async function openHymnSheet(number) {
    activeHymn = hymnDatabase.find(h => h.number === number);
    if (!activeHymn || !pdfDoc) return;
    
    document.getElementById('view-music').classList.remove('hidden');
    document.getElementById('musicTitle').textContent = `${activeHymn.number}. ${activeHymn.title}`;
    activePage = activeHymn.page;
    updateFavBtnUI();
    await renderPDFPage(activePage);
}

async function renderPDFPage(pageNum) {
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.2 });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('canvasScrollArea').scrollTop = 0;
}

function turnPage(direction) {
    activePage += direction;
    if (activePage < 1) activePage = 1;
    if (activePage > pdfDoc.numPages) activePage = pdfDoc.numPages;
    renderPDFPage(activePage);
}

function closeMusicViewer() {
    document.getElementById('view-music').classList.add('hidden');
}

document.getElementById('searchInput').oninput = (e) => {
    const query = e.target.value.toLowerCase().trim();
    const resultsBox = document.getElementById('searchResults');
    if(!query) { resultsBox.innerHTML = ""; return; }

    const matches = hymnDatabase.filter(h => 
        h.title.toLowerCase().includes(query) || h.number.toString().includes(query)
    );
    resultsBox.innerHTML = matches.map(h => `
        <div onclick="openHymnSheet(${h.number})" class="p-4 hover:bg-[#F3EBE0] cursor-pointer flex justify-between items-center transition">
            <span><strong class="brand-text font-mono">${h.number}.</strong> ${h.title}</span>
            <span class="text-xs opacity-50">Page ${h.page}</span>
                </div>
    `).join('') || `<div class="p-4 text-center opacity-50 text-sm">No matching hymns found</div>`;
};

function toggleFavoriteCurrent() {
    if (!activeHymn) return;
    const idx = bookmarks.indexOf(activeHymn.number);
    if (idx > -1) bookmarks.splice(idx, 1);
    else bookmarks.push(activeHymn.number);
    localStorage.setItem('hymn_bookmarks', JSON.stringify(bookmarks));
    updateFavBtnUI();
}

function updateFavBtnUI() {
    const btn = document.getElementById('musicFavBtn');
    if (activeHymn && bookmarks.includes(activeHymn.number)) {
        btn.textContent = "★"; btn.className = "text-2xl text-amber-400";
    } else {
        btn.textContent = "☆"; btn.className = "text-2xl text-white/60";
    }
}

function renderFavoritesView() {
    const box = document.getElementById('favoritesList');
    const favHymns = hymnDatabase.filter(h => bookmarks.includes(h.number));
    box.innerHTML = favHymns.map(h => `
        <div onclick="openHymnSheet(${h.number})" class="p-4 bg-white hover:bg-[#F3EBE0] cursor-pointer flex justify-between items-center transition">
            <span><strong class="brand-text font-mono">${h.number}.</strong> ${h.title}</span>
            <span class="text-sm opacity-40">➔</span>
        </div>
    `).join('') || `<div class="p-6 text-center opacity-50 text-sm bg-white">Your bookmarked hymns will show up here</div>`;
}

async function init() {
    try {
        pdfDoc = await pdfjsLib.getDocument('hymnal.pdf').promise;
    } catch (err) {
        alert("Could not load hymnal.pdf. Make sure it is in your GitHub folder and named exactly lowercase 'hymnal.pdf'.");
    }
}
init();
