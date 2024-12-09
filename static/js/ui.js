import { COLOR_SCHEMES, FILTER_RANGES } from './constants.js';

export class UIManager {
    constructor(meteorites, craters) {
        console.log('UI module loading');
        this.meteorites = meteorites;
        this.craters = craters;
        this.colorSchemes = COLOR_SCHEMES;
        this.initializeElements();
        this.initializeColorSchemes();
        this.initializeFilters();
        this.setupEventListeners();
        this.searchDebounceTimer = null;
    }

    initializeColorSchemes() {
        this.colorSchemes = COLOR_SCHEMES;
        this.populateColorSchemes();
        this.updateLegends();
    }

    initializeFilters() {
        // Set fixed ranges for crater sliders with explicit value setting
        const craterSliders = {
            diameter: { min: 0, max: 300, unit: 'km' },
            age: { min: 0, max: 3000, unit: 'Myr' }
        };

        Object.entries(craterSliders).forEach(([type, config]) => {
            const minSlider = document.getElementById(`${type}RangeMin`);
            const maxSlider = document.getElementById(`${type}RangeMax`);

            if (minSlider && maxSlider) {
                // Set range
                minSlider.min = config.min;
                minSlider.max = config.max;
                maxSlider.min = config.min;
                maxSlider.max = config.max;

                // Set initial values
                minSlider.value = config.min;
                maxSlider.value = config.max; // Explicitly set to max value

                // Force update display
                this.updateRangeDisplay(type);
            }
        });

        requestAnimationFrame(() => {
            const diameterMax = document.getElementById('diameterRangeMax');
            const ageMax = document.getElementById('ageRangeMax');

            if (diameterMax) {
                diameterMax.value = 300;
                diameterMax.dispatchEvent(new Event('input'));
            }

            if (ageMax) {
                ageMax.value = 3000;
                ageMax.dispatchEvent(new Event('input'));
            }

            this.updateFilterDisplays();
        });

        // Initialize meteorite sliders
        const yearMin = document.getElementById('yearRangeMin');
        const yearMax = document.getElementById('yearRangeMax');
        const massMin = document.getElementById('massRangeMin');
        const massMax = document.getElementById('massRangeMax');

        yearMin.value = FILTER_RANGES.YEAR.MIN;
        yearMax.value = FILTER_RANGES.YEAR.MAX;
        massMin.value = FILTER_RANGES.MASS.MIN;
        massMax.value = FILTER_RANGES.MASS.MAX;

        this.updateFilterDisplays();
    }

    applyFilters() {
        const filterState = {
            meteorites: {
                year: {
                    min: parseInt(document.getElementById('yearRangeMin').value),
                    max: parseInt(document.getElementById('yearRangeMax').value)
                },
                mass: {
                    min: parseFloat(document.getElementById('massRangeMin').value),
                    max: parseFloat(document.getElementById('massRangeMax').value)
                },
                classes: Array.from(document.getElementById('meteoriteClassSelect').selectedOptions)
                    .map(opt => opt.value)
            },
            craters: {
                diameter: {
                    min: parseFloat(document.getElementById('diameterRangeMin').value),
                    max: parseFloat(document.getElementById('diameterRangeMax').value)
                },
                age: {
                    min: parseFloat(document.getElementById('ageRangeMin').value),
                    max: parseFloat(document.getElementById('ageRangeMax').value)
                },
                targetRocks: Array.from(document.getElementById('targetRockSelect').selectedOptions)
                    .map(opt => opt.value),
                types: Array.from(document.getElementById('craterTypeSelect').selectedOptions)
                    .map(opt => opt.value)
            }
        };

        // Emit filter update event
        const event = new CustomEvent('filtersUpdated', { detail: filterState });
        window.dispatchEvent(event);
    }

    resetFilters() {
        this.showLoadingIndicator();

        setTimeout(() => {
            // Reset meteorite filters
            document.getElementById('yearRangeMin').value = 860;
            document.getElementById('yearRangeMax').value = 2023;
            document.getElementById('massRangeMin').value = 0;
            document.getElementById('massRangeMax').value = 60000000;

            // Reset crater filters
            document.getElementById('diameterRangeMin').value = 0;
            document.getElementById('diameterRangeMax').value = 300;
            document.getElementById('ageRangeMin').value = 0;
            document.getElementById('ageRangeMax').value = 3000;

            // Reset all multi-selects
            ['meteoriteClassSelect', 'targetRockSelect', 'craterTypeSelect'].forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    Array.from(select.options).forEach(option => option.selected = false);
                }
            });

            // Reset visibility and clustering
            document.getElementById('toggleMeteorites').checked = true;
            document.getElementById('toggleCraters').checked = true;
            document.getElementById('clusterMeteorites').checked = true;

            // Update all range displays
            ['year', 'mass', 'diameter', 'age'].forEach(type => {
                this.updateRangeDisplay(type);
            });

            // Apply filters and update visualization
            this.applyFilters();
            this.hideLoadingIndicator();
        }, 100);
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
            infoModal: document.getElementById('infoModal'),
            fullscreenButton: document.getElementById('fullscreenButton')
        };
    }

    setupEventListeners() {
        this.setupMenuHandlers();
        this.setupModalHandlers();
        this.setupFilterHandlers();
        this.setupTableHandlers();
        this.setupSearchHandler();
        this.setupFullscreenHandler();

        // Visibility toggles
        document.getElementById('toggleMeteorites').addEventListener('change', (e) => {
            this.meteorites.setVisibility(e.target.checked);
        });

        document.getElementById('toggleCraters').addEventListener('change', (e) => {
            this.craters.setVisibility(e.target.checked);
        });

        // Clustering toggle
        document.getElementById('clusterMeteorites').addEventListener('change', (e) => {
            this.meteorites.setClusteringEnabled(e.target.checked);
        });

        // Filter updates
        document.getElementById('applyFiltersButton').addEventListener('click', () => {
            this.showLoadingIndicator();
            setTimeout(() => {
                this.applyFilters();
                this.hideLoadingIndicator();
            }, 100);
        });

        // Reset filters
        document.getElementById('refreshButton').addEventListener('click', () => {
            this.showLoadingIndicator();
            setTimeout(() => {
                this.resetFilters();
                this.applyFilters();
                this.hideLoadingIndicator();
            }, 100);
        });

        // Event listener for 'View All' buttons
        document.addEventListener('click', (event) => {
            if (event.target.closest('.view-all')) {
                const button = event.target.closest('.view-all');
                const type = button.dataset.type;
                if (type === 'meteorite') {
                    this.openModal('meteorite');
                } else if (type === 'crater') {
                    this.openModal('crater');
                }
            }
        });
    }

    setupMenuHandlers() {
        const menuButtons = {
            'optionsButton': 'controls',
            'keyButton': 'keyMenu',
            'infoButton': 'infoModal'
        };

        Object.entries(menuButtons).forEach(([buttonId, menuId]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.onclick = () => this.toggleMenu(menuId);
            }
        });
    }

    toggleMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (!menu) return;

        const isVisible = menu.style.display === 'block';
        if (!isVisible) {
            this.closeOtherMenus(menuId);
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    }

    closeOtherMenus(openedMenu) {
        const menus = ['controls', 'keyMenu', 'infoModal'];
        menus.forEach(menuId => {
            if (menuId !== openedMenu) {
                const menu = document.getElementById(menuId);
                if (menu) menu.style.display = 'none';
            }
        });
    }

    setupModalHandlers() {
        // Close buttons for modals
        document.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', () => {
                button.closest('.modal').style.display = 'none';
            });
        });

        // Modal search inputs
        this.setupTableHandlers();
    }

    setupFilterHandlers() {
        // Make range values editable
        document.querySelectorAll('.editable-value').forEach(span => {
            span.style.cursor = 'pointer';
            span.addEventListener('click', () => {
                const type = span.getAttribute('data-type');
                this.handleRangeEdit(type);
            });
        });

        // Add slider update handlers
        ['year', 'mass', 'diameter', 'age'].forEach(type => {
            const minSlider = document.getElementById(`${type}RangeMin`);
            const maxSlider = document.getElementById(`${type}RangeMax`);

            if (minSlider && maxSlider) {
                [minSlider, maxSlider].forEach(slider => {
                    slider.addEventListener('input', () => {
                        this.updateRangeDisplay(type);
                    });
                });
            }
        });
    }

    setupTableHandlers() {
        // Meteorite modal search input
        const meteoriteSearchInput = document.getElementById('meteoriteSearchInput');
        if (meteoriteSearchInput) {
            meteoriteSearchInput.addEventListener('input', () => {
                this.updateMeteoriteModalTable();
            });
        }

        // Crater modal search input
        const craterSearchInput = document.getElementById('craterSearchInput');
        if (craterSearchInput) {
            craterSearchInput.addEventListener('input', () => {
                this.updateCraterModalTable
