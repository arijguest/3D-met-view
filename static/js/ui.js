export class UIManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.searchDebounceTimer = null;
    }

    initializeElements() {
        this.elements = {
            tooltip: document.getElementById('tooltip'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            meteoriteBar: document.getElementById('meteoriteBar'),
            craterBar: document.getElementById('craterBar'),
            searchInput: document.getElementById('searchInput'),
            controls: document.getElementById('controls'),
            keyMenu: document.getElementById('keyMenu'),
            infoModal: document.getElementById('infoModal')
        };
    }

    setupEventListeners() {
        this.setupMenuHandlers();
        this.setupModalHandlers();
        this.setupFilterHandlers();
        this.setupTableHandlers();
        this.setupSearchHandler();
    }

    setupMenuHandlers() {
        const menuButtons = {
            'optionsButton': 'controls',
            'keyButton': 'keyMenu',
            'infoButton': 'infoModal'
        };

        Object.entries(menuButtons).forEach(([buttonId, menuId]) => {
            document.getElementById(buttonId).onclick = () => {
                this.toggleMenu(menuId);
            };
        });
    }

    setupModalHandlers() {
        ['modal', 'craterModal', 'infoModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            const closeBtn = modal.querySelector('.close-button');
            
            closeBtn.onclick = () => this.closeModal(modalId);
            window.onclick = (event) => {
                if (event.target === modal) this.closeModal(modalId);
            };
        });
    }

    setupFilterHandlers() {
        const filterInputs = document.querySelectorAll('.filter-input');
        filterInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debounce(() => this.updateFilterDisplay(input), 100);
            });
        });
    }

    setupTableHandlers() {
        ['meteoriteSearchInput', 'craterSearchInput'].forEach(searchId => {
            document.getElementById(searchId).addEventListener('input', (e) => {
                this.debounce(() => this.filterTable(e.target.value, searchId), 300);
            });
        });
    }

    setupSearchHandler() {
        this.elements.searchInput.addEventListener('input', (e) => {
            this.debounce(() => this.handleSearch(e.target.value), 300);
        });
    }

    updateTooltip(entity, position) {
        if (!entity || !position) {
            this.hideTooltip();
            return;
        }

        const content = this.getTooltipContent(entity);
        if (!content) return;

        this.elements.tooltip.innerHTML = content;
        this.elements.tooltip.style.display = 'block';
        this.updateTooltipPosition(position);
    }

    updateTooltipPosition(position) {
        const x = position.x + 15;
        const y = position.y + 15;
        this.elements.tooltip.style.left = `${x}px`;
        this.elements.tooltip.style.top = `${y}px`;
    }

    updateDataBars(meteorites, craters) {
        this.updateMeteoriteBar(meteorites);
        this.updateCraterBar(craters);
    }

    updateMeteoriteBar(meteorites) {
        const content = this.generateBarContent(meteorites, 'meteorite');
        this.elements.meteoriteBar.innerHTML = content;
    }

    updateCraterBar(craters) {
        const content = this.generateBarContent(craters, 'crater');
        this.elements.craterBar.innerHTML = content;
    }

    updateFilterCounts(meteoriteCount, craterCount) {
        document.getElementById('totalMeteorites').textContent = `Total Meteorites: ${meteoriteCount}`;
        document.getElementById('totalCraters').textContent = `Total Craters: ${craterCount}`;
    }

    showLoadingIndicator() {
        this.elements.loadingIndicator.style.display = 'block';
    }

    hideLoadingIndicator() {
        this.elements.loadingIndicator.style.display = 'none';
    }

    debounce(callback, delay = 300) {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(callback, delay);
    }
}

