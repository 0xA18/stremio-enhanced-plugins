/**
 * @name FilterStreams
 * @description Filters a movie's/tv show's episode's streams
 * @updateUrl https://raw.githubusercontent.com/0xA18/stremio-enhanced-plugins/refs/heads/main/versions/filterStreams.txt
 * @version 0.1.0
 * @author a18 corp.
 */

(function () {
    "use strict";

    class DivDropdown {
        constructor(root, _placeholder) {
            this.root = root;
            this.button = root.querySelector('.dd-toggle');
            this.list = root.querySelector('.dd-list');
            this.options = Array.from(root.querySelectorAll('.dd-option'));
            this.labelEl = root.querySelector('.dd-label');
            this.placeholder = _placeholder || 'Select';
            this.value = null;
            this.activeIndex = -1;

            // ARIA setup
            this.options.forEach((opt, i) => {
            if (!opt.id) opt.id = this._uid('ddopt');
            opt.setAttribute('tabindex', '-1');
            });

            this._renderLabel();
            this._bind();
        }

        _uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; }

        _bind() {
            // Toggle open/close
            this.button.addEventListener('click', () => this.toggle());
            this.button.addEventListener('keydown', (e) => this._onButtonKey(e));

            // Option click
            this.options.forEach((opt, i) => {
                opt.addEventListener('click', () => { this._commit(i); this.close(); this.button.focus(); });
                opt.addEventListener('mousemove', () => this._setActive(i));
            });

            // Keyboard on list
            this.list.addEventListener('keydown', (e) => this._onListKey(e));

            // Click outside
            document.addEventListener('click', (e) => {
                if (!this.root.contains(e.target)) this.close();
            });

            // Focus out closes
            this.root.addEventListener('focusout', (e) => {
                // Delay to allow focus to move within component
                setTimeout(() => { if (!this.root.contains(document.activeElement)) this.close(); }, 0);
            });
        }

        open() {
            if (this.root.classList.contains('is-open')) return;
            this.root.classList.add('is-open');
            this.button.setAttribute('aria-expanded', 'true');
            // Ensure some active index
            if (this.activeIndex < 0) {
                const selIndex = this._selectedIndex();
                this._setActive(selIndex >= 0 ? selIndex : 0);
            }
            this.list.focus({ preventScroll: false });
            this._scrollActiveIntoView();
        }

        close() {
            if (!this.root.classList.contains('is-open')) return;
            this.root.classList.remove('is-open');
            this.button.setAttribute('aria-expanded', 'false');
        }

        toggle() { this.root.classList.contains('is-open') ? this.close() : this.open(); }

        _onButtonKey(e) {
            switch (e.key) {
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Enter':
            case ' ': // Space
                e.preventDefault();
                this.open();
                break;
                default: break;
            }
        }

        _onListKey(e) {
            const max = this.options.length - 1;
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this._setActive(Math.min(max, (this.activeIndex < 0 ? 0 : this.activeIndex + 1)));
                    this._scrollActiveIntoView();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this._setActive(Math.max(0, (this.activeIndex < 0 ? 0 : this.activeIndex - 1)));
                    this._scrollActiveIntoView();
                    break;
                case 'Home':
                    e.preventDefault();
                    this._setActive(0);
                    this._scrollActiveIntoView();
                    break;
                case 'End':
                    e.preventDefault();
                    this._setActive(max);
                    this._scrollActiveIntoView();
                    break;
                case 'Enter':
                case ' ': // Space
                    e.preventDefault();
                    if (this.activeIndex >= 0) {
                        this._commit(this.activeIndex);
                        this.close();
                        this.button.focus();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    this.button.focus();
                    break;
                case 'Tab':
                    this.close();
                    break;
                default:
                    // Typeahead: jump to first option starting with typed char(s)
                    if (e.key.length === 1 && /\S/.test(e.key)) {
                        this._typeahead(e.key);
                    }
            }
        }

        _typeahead(ch) {
            const start = (this.activeIndex + 1) % this.options.length;
            const hay = this.options.map(o => o.textContent.trim().toLowerCase());
            const idx = hay.findIndex((t, i) => hay[(start + i) % hay.length].startsWith(ch.toLowerCase()));
            if (idx !== -1) {
                const target = (start + idx) % hay.length;
                this._setActive(target);
                this._scrollActiveIntoView();
            }
        }

        _setActive(i) {
            if (i < 0 || i >= this.options.length) return;
            if (this.activeIndex === i) return;
            if (this.activeIndex >= 0) this.options[this.activeIndex].classList.remove('is-active');
            this.activeIndex = i;
            const opt = this.options[i];
            opt.classList.add('is-active');
            this.list.setAttribute('aria-activedescendant', opt.id);
        }

        _selectedIndex() {
            return this.options.findIndex(o => o.getAttribute('aria-selected') === 'true');
        }

        _commit(i) {
            const opt = this.options[i];
            this.options.forEach(o => o.setAttribute('aria-selected', 'false'));
            opt.setAttribute('aria-selected', 'true');
            this.value = opt.dataset.value ?? opt.textContent.trim();
            this.root.dataset.value = this.value;
            this._renderLabel(opt.textContent.trim());
            this.root.dispatchEvent(new CustomEvent('change', { detail: { value: this.value, label: opt.textContent.trim() } }));
        }

        _renderLabel(text) {
            const label = text || this.placeholder;
            this.labelEl.textContent = label;
            this.labelEl.classList.toggle('dd-placeholder', !text);
        }

        _scrollActiveIntoView() {
            const opt = this.options[this.activeIndex];
            if (!opt) return;
            const listRect = this.list.getBoundingClientRect();
            const optRect = opt.getBoundingClientRect();
            if (optRect.top < listRect.top) {
                this.list.scrollTop -= (listRect.top - optRect.top) + 4;
            } else if (optRect.bottom > listRect.bottom) {
                this.list.scrollTop += (optRect.bottom - listRect.bottom) + 4;
            }
        }
    }

    class StreamInfo {
        constructor({ title, languages, quality, size, streamOrigin, codecs }) {
            this.title = title;
            this.languages = languages;
            this.quality = quality;
            this.size = size;
            this.streamOrigin = streamOrigin;
            this.codecs = codecs;
        }
    }

    function getStreamFaceLine(str){
        for (const line of str.split('\n')){
            if (line.startsWith('👤')){
                return line;
            }
        }
        return null;
    }

    function parseStreamElements(links, year) {
        const results = [];

        // Happy.Gilmore.2.2025.2160p.NF.WEB-DL.SDR.LATINO.HINDI.RUS.UKR.Atmos.H265.MP4-BTM
        //👤 27 💾 13.73 GB ⚙️ ThePirateBay
        //Multi Audio / 🇷🇺 / 🇲🇽 / 🇮🇳 / 🇺🇦

        // Happy.gilmore.2.2025.1080p-dual-lat-cinecalidad.rs.mp4
        // 👤 76 💾 2.1 GB ⚙️ Cinecalidad
        // Dual Audio / 🇲🇽
        //console.log(year);

        // Wednesday.S01.2160p.NF.WEB-DL.x265.10bit.HDR.DDP5.1.Atmos-APEX
        // Wednesday.S01E01.Wednesdays.Child.is.Full.of.Woe.2160p.NF.WEB-DL.DDP5.1.Atmos.DV.HDR.H.265-APEX.mkv
        // 👤 40 💾 7.94 GB ⚙️ TorrentGalaxy
        links.forEach(link => {
            const lines = link[0].split('\n');
            const i = lines[0].indexOf(year);
            const titleRaw = lines[0].slice(0, i);
            let splitter = '.';
            if (titleRaw[titleRaw.length - 1] == '(') splitter = titleRaw[titleRaw.length - 2];
            else splitter = titleRaw[titleRaw.length - 1];
            const afterTitle = lines[0].slice(0 + lines[0].indexOf(year));
            let languages;
            
            if (lines[lines.length - 1].split(" / ").length > 1){
                languages = lines[lines.length - 1].split(" / ");
                // TODO: check every index of the array
                if (languages[0].toLowerCase() == "dual audio" || languages[0].toLowerCase() == "multi audio"|| languages[0].toLowerCase() == "multi subs")
                    languages.shift();
            }
            else languages = undefined;

            let size = undefined;
            let streamOrigin = undefined;
            let faceLine = getStreamFaceLine(link[0]);
            if (faceLine){
                size = faceLine.split(' ')[3] + " " + faceLine.split(' ')[4];
                streamOrigin = faceLine.split(' ')[6];
            }

            const codecPattern = /\b(HEVC|HDR|HDR10|x265|x264|AV1|H\.264|H\.265)\b/gi;
            const codecs = Array.from(lines[0].matchAll(codecPattern), m => m[1]);

            const qualityPattern = /\b(4K|1080p|720p|576p|480p|BDRip|BRRip|HDRip|DVDRip|WEBRip|WEB-DL|BluRay)\b/gi;
            const quality = Array.from(link[1].matchAll(qualityPattern), m => m[1])[0];

            results.push(new StreamInfo({
                titleRaw,
                languages,
                quality,
                size,
                streamOrigin,
                codecs,
            }));
            //console.log(link[1]);
        });

        //console.log(results);
        return results;
    }

    let selectedStreams = new StreamInfo({
        title: "all", 
        languages: "all", 
        quality: "all", 
        size: "all", 
        streamOrigin: "all", 
        codecs: "all"
    });
    // TODO: remove non-found streams from dropdown
    function filterStreams(e) {
        const streamsContainer = document
            .querySelector('.streams-list-Y1lCM')
            .querySelector('.streams-container-bbSc4');

        let allStreams = 0;
        let hiddenStreams = 0;

        for (const elem of streamsContainer.querySelectorAll('a')) {
            const streamLeft = elem.querySelector(".addon-name-tC8PX");
            const streamRight = elem.querySelector(".description-container-vW_De");

            const qualityMatch =
                streamLeft.textContent.includes(selectedStreams.quality) ||
                selectedStreams.quality.toLowerCase() === "all";

            const languageMatch =
                streamRight.textContent.includes(selectedStreams.languages) ||
                selectedStreams.languages === "all";

            const faceLine = getStreamFaceLine(streamRight.textContent);
            let originMatch = undefined;
            if (faceLine){
                originMatch = faceLine.includes(selectedStreams.streamOrigin) ||
                selectedStreams.streamOrigin === "all";
            }

            if (qualityMatch && languageMatch && originMatch) {
                elem.style.visibility = "visible";
                elem.style.position = "relative";
            } else {
                elem.style.visibility = "hidden";
                elem.style.position = "absolute";
                hiddenStreams++;
            }

            allStreams++;
        }
    }

    function createDropdown(found, text, className, onChange){
        if (found.length < 2) return;
        const selector1 = document.createElement("div");
        selector1.innerHTML = `<div class="dd-toggle" role="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="dd-list-1" tabindex="0">
                <span class="dd-label dd-placeholder">${text}</span>
                <span class="dd-caret" aria-hidden="true"></span>
            </div>`;
        selector1.classList.add("dropdown", "observer-ignore", className);
        selector1.addEventListener('change', (e) => {
            //console.log(selectedStreams);
            onChange(e);
            filterStreams(e);
        });
        //selector.appendChild(selector1);

        const dropdown = document.createElement("div");
        dropdown.innerHTML = '<div class="dd-option" role="option" aria-selected="false" data-value="all" tabindex="-1">All</div>';
        dropdown.tabIndex = 0;
        dropdown.ariaExpanded = "false";
        dropdown.classList.add("dd-list");
        
        selector1.appendChild(dropdown);
        for (const obj of found){
            if (obj != "undefined" && obj){
                const newElem = document.createElement("div");
                newElem.tabIndex = 0;
                newElem.ariaSelected = "false";
                newElem.classList.add("dd-option");
                newElem.id = "dd-list-1";
                //newElem.tabIndex = "-1";
                newElem.role = "option";
                const elemTitle = document.createElement("div");
                //elemTitle.classList.add("label-IR8xX");
                elemTitle.textContent = obj;
                newElem.appendChild(elemTitle);

                dropdown.appendChild(newElem);
            }
        }

        new DivDropdown(selector1, text);

        const parent = document.querySelector(".select-choices-wrapper-xGzfs.filter-streams");
        parent.insertBefore(selector1, parent.firstChild);
    }

    function createFilters(){
        const streamsContainer = document.querySelector('.streams-list-Y1lCM').querySelector('.streams-container-bbSc4');
        
        const streamLinks = Array.from(streamsContainer.querySelectorAll('a'))
                .map(a => {
                const desc = a.querySelector('.description-container-vW_De');
                const addon = a.querySelector(".addon-name-tC8PX");
                return [desc ? desc.textContent.trim() : null, addon.textContent];
                })
            .filter(Boolean); // remove nulls
            // Optional: log or return the links
            const filmYear = document.querySelector(".release-info-label-LPJMB").innerHTML;
            const streams = parseStreamElements(streamLinks, filmYear);
            
            const container = document.createElement("div");
            container.classList.add("select-choices-wrapper-xGzfs", "filter-streams");
            const parent = document.querySelector(".streams-list-Y1lCM.streams-list-container-xYMJo");
            parent.insertBefore(container, parent.firstChild);

            let foundQualities = [];
            for (const stream of streams){
                if (!foundQualities.includes(stream.quality))
                    foundQualities.push(stream.quality);
            }

            let foundLanguages = [];
            for (const stream of streams){
                if (stream.languages != undefined){
                    for (const lang of stream.languages){
                        if (!foundLanguages.includes(lang))
                            foundLanguages.push(lang);
                    }
                }
                
            }


            let foundOrigins = [];
            for (const stream of streams){
                if (!foundOrigins.includes(stream.streamOrigin)){
                    foundOrigins.push(stream.streamOrigin);

                }
            }
            // note: they have to be in reverse order
            createDropdown(foundOrigins, "Origin", "origin-selection", (e) => {selectedStreams.streamOrigin = e.detail.value;});
            createDropdown(foundLanguages, "Language", "language-selection", (e) => {selectedStreams.languages = e.detail.value;});
            createDropdown(foundQualities, "Quality", "quality-selection", (e) => {selectedStreams.quality = e.detail.value;});
    }

    const observer = new MutationObserver((mutationList, observer) => {
        for (let i = 0; i < mutationList.length; i++) {
            for (const node of mutationList[i].addedNodes){
                if (node.nodeType === 1 && node.classList.contains("observer-ignore")) return;
            }

            //console.log(i);
            if (!mutationList[i].target.classList.contains("streams-list-Y1lCM")) break;
            const mainContainer = document.querySelector('.streams-list-Y1lCM');
            if (!mainContainer) {
                console.warn('Main container not found.');
                break;
            }

            if (mainContainer.querySelector(".dropdown.observer-ignore.quality-selection" || mainContainer.querySelector(".dropdown.observer-ignore.language-selection"))){
                //mainContainer.querySelector(".dropdown.observer-ignore.quality-selection").remove();
                return;
            }

            const streamsContainer = mainContainer.querySelector('.streams-container-bbSc4');
            if (!streamsContainer) {
                console.warn('Streams container not found.');
                break;
            }

            

            createFilters();
        }

    });
    observer.observe(document.body, { childList: true, subtree: true });

    
    function checkElements() {
    const existsStreamsList = document.querySelector('.streams-list-Y1lCM');
    const missingDropdown = !document.querySelector('.dropdown.observer-ignore');
    const streamsInited = document.querySelector(".label-container-XOyzm.stream-container-JPdah.button-container-zVLH6");

    if (existsStreamsList && missingDropdown && streamsInited) {
        console.log("there is!");
        createFilters();
    }
}

const intervalId = setInterval(checkElements, 200);

    window.onload = function(){
        const style = document.createElement("style");
        style.innerHTML =
`:root {
    --dd-bg: #000000ff;
    --dd-border: #111111ff;
    --dd-text: #ffffffff;
    --dd-muted: #dbdbdbff;
    --dd-shadow: 0 6px 16px rgba(0,0,0,0.12);
    --dd-radius: 0;
}

* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"; padding: 24px; color: var(--dd-text); }

.dropdown {
    position: relative;
    width: 100%;
    height: fit-content;
    min-height: fit-content;
}

.dd-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    /*background: var(--dd-bg);*/
    border-radius: var(--dd-radius);
    cursor: pointer;
    user-select: none;
    outline: none;
}
.dd-toggle:hover{
    background: #ffffff13;
}
.dd-toggle:focus { box-shadow: 0 0 0 3px rgba(0, 110, 255, .25); }
.dd-toggle .dd-placeholder { color: var(--dd-muted); }

.dd-caret { flex: 0 0 auto; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid rgb(219, 219, 219); }
.dropdown.is-open .dd-caret { transform: rotate(180deg); }

.select-choices-wrapper-xGzfs.filter-streams{
    display: grid;
    grid-template-columns: auto auto auto;
    align-items: top;
    align-content: top;
}

.dd-list {
    height: fit-content;
    /* position: absolute; */
    z-index: 9999;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--dd-bg);
    border: 1px solid var(--dd-border);
    border-radius: var(--dd-radius);
    box-shadow: var(--dd-shadow);
    display: none;
    min-height: 100px;
    max-height: 240px;
    overflow: auto;
}
.dropdown.is-open .dd-list { display: block; }

.dd-option {
    padding: 12px 16px;
    border-radius: 0;
    cursor: pointer;
    outline: none;
}
.dd-option[aria-selected="true"] { font-weight: 600; }
.dd-option:hover,
.dd-option[aria-activedescendant="true"],
.dd-option.is-active { background: #0f0f0fff; }

/* Optional tiny helper for visually hidden text for a11y */
.visually-hidden { position: absolute !important; height: 1px; width: 1px; overflow: hidden; clip: rect(1px, 1px, 1px, 1px); white-space: nowrap; }

.observer-ignore{
    min-width: fit-content;
}`
        document.body.appendChild(style);
    }();

})();