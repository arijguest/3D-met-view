import { COLOR_SCHEMES, FILTER_RANGES } from './constants.js';

export class UIManager {
    constructor() {
        console.log('UI module loading');
        this.colorSchemes = COLOR_SCHEMES;
        this.initializeElements();
        this.setupEventListeners();
        this.searchDebounceTimer = null;
        this.initializeColorSchemes();
    }

    initializeColorSchemes() {
        this.colorSchemes = COLOR_SCHEMES;
        this.populateColorSchemes();
        this.updateLegends();
    }

    initializeFilters(meteorites, craters) {
        // Set ranges based on actual data
        const craterDiameters = craters
            .map(c => parseFloat(c.properties['Crater diamter [km]']))
            .filter(d => !isNaN(d));
        const craterAges = craters
            .map(c => parseFloat(c.properties['Age [Myr]']))
            .filter(a => !isNaN(a));
    
        const maxDiameter = Math.max(...craterDiameters);
        const maxAge = Math.max(...craterAges);
    
        // Set slider values
        document.getElementById('diameterRangeMin').value = 0;
        document.getElementById('diameterRangeMax').value = maxDiameter;
        document.getElementById('ageRangeMin').value = 0;
        document.getElementById('ageRangeMax').value = maxAge;
    
        // Populate dropdowns
        this.populateDropdowns(meteorites, craters);
        this.updateFilterDisplays();
    }

    initializeInfoMenu() {
        const infoModal = document.getElementById('infoModal');
        const infoButton = document.getElementById('infoButton');
        const closeInfoModal = document.getElementById('closeInfoModal');
    
        infoButton.onclick = () => {
            this.closeOtherMenus('info');
            infoModal.style.display = 'block';
        };
    
        closeInfoModal.onclick = () => infoModal.style.display = 'none';
        
        window.onclick = (event) => {
            if (event.target === infoModal) {
                infoModal.style.display = 'none';
            }
        };
    }

    setupFullscreenHandler() {
        this.elements.fullscreenButton.onclick = () => {
            if (!document.fullscreenElement) {
                document.getElementById('wrapper').requestFullscreen();
                this.elements.fullscreenButton.textContent = '🡼 Exit Fullscreen';
            } else {
                document.exitFullscreen();
                this.elements.fullscreenButton.textContent = '⛶ Fullscreen';
            }
        };
    }
    
    closeOtherMenus(openedMenu) {
        const menus = {
            'options': 'controls',
            'key': 'keyMenu',
            'info': 'infoModal'
        };
        
        Object.entries(menus).forEach(([key, id]) => {
            if (key !== openedMenu) {
                document.getElementById(id).style.display = 'none';
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
            const closeButton = document.querySelector(`#${menuId} .close-button`);
            
            button.onclick = () => this.toggleMenu(menuId);
            closeButton.onclick = () => document.getElementById(menuId).style.display = 'none';
        });
    }
    
    populateColorSchemes() {
        const meteoriteSelect = document.getElementById('meteoriteColorScheme');
        const craterSelect = document.getElementById('craterColorScheme');
        
        Object.keys(COLOR_SCHEMES).forEach(scheme => {
            meteoriteSelect.add(new Option(scheme, scheme));
            craterSelect.add(new Option(scheme, scheme));
        });
    
        meteoriteSelect.value = 'DEFAULT';
        craterSelect.value = 'BLUE_SCALE';
    }

    updateLegends() {
        this.updateMeteoriteLegend();
        this.updateCraterLegend();
    }

    updateMeteoriteLegend() {
        const legendContainer = document.getElementById('meteoriteLegend');
        const selectedScheme = document.getElementById('meteoriteColorScheme').value;
        const scheme = COLOR_SCHEMES[selectedScheme].meteorites;
    
        legendContainer.innerHTML = `
            <h3>🌠 Meteorites</h3>
            <ul class="legend-list">
                ${this.generateLegendItems(scheme, 'mass')}
            </ul>
        `;
    }
    
    updateCraterLegend() {
        const legendContainer = document.getElementById('craterLegend');
        const selectedScheme = document.getElementById('craterColorScheme').value;
        const scheme = COLOR_SCHEMES[selectedScheme].craters;
    
        legendContainer.innerHTML = `
            <h3>💥 Impact Craters</h3>
            <ul class="legend-list">
                ${this.generateLegendItems(scheme, 'diameter')}
            </ul>
        `;
    }

    generateLegendItems(scheme, type) {
        const sortedScheme = [...scheme].sort((a, b) => a.threshold - b.threshold);
        return sortedScheme.map((item, index) => {
            const label = type === 'mass' 
                ? `Mass ${index === 0 ? '<' : '≥'} ${this.formatMass(item.threshold)}`
                : `Diameter ${index === 0 ? '<' : '≥'} ${item.threshold} km`;
            
            return `
                <li>
                    <span class="legend-icon" style="background-color: ${item.color.toCssColorString()};"></span>
                    ${label}
                </li>
            `;
        }).join('');
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

    populateDropdowns(meteorites, craters) {
        // Meteorite classes
        const meteoriteClasses = [...new Set(meteorites
            .map(m => m.recclass)
            .filter(Boolean))];
        this.populateSelect('meteoriteClassSelect', meteoriteClasses);
    
        // Target rocks
        const targetRocks = [...new Set(craters
            .map(c => c.properties.Target)
            .filter(Boolean))];
        this.populateSelect('targetRockSelect', targetRocks);
    
        // Crater types
        const craterTypes = [...new Set(craters
            .map(c => c.properties['Crater type'])
            .filter(Boolean))];
        this.populateSelect('craterTypeSelect', craterTypes);
    }

    populateSelect(id, options) {
        const select = document.getElementById(id);
        select.innerHTML = options
            .sort()
            .map(opt => `<option value="${opt}">${opt}</option>`)
            .join('');
    }

    updateFilterDisplays() {
        document.getElementById('yearRangeValue').textContent = 
            `${document.getElementById('yearRangeMin').value} - ${document.getElementById('yearRangeMax').value}`;
        
        document.getElementById('massRangeValue').textContent = 
            `${this.formatMass(document.getElementById('massRangeMin').value)} - ${this.formatMass(document.getElementById('massRangeMax').value)}`;
        
        document.getElementById('diameterRangeValue').textContent = 
            `${document.getElementById('diameterRangeMin').value} - ${document.getElementById('diameterRangeMax').value} km`;
        
        document.getElementById('ageRangeValue').textContent = 
            `${document.getElementById('ageRangeMin').value} - ${document.getElementById('ageRangeMax').value} Myr`;
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
        ['modal', 'craterModal', 'infoModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            const closeBtn = modal.querySelector('.close-button');
            if (closeBtn) {
                closeBtn.onclick = () => this.closeModal(modalId);
            }
            
            window.onclick = (event) => {
                if (event.target === modal) this.closeModal(modalId);
            };
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
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
            const searchInput = document.getElementById(searchId);
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.debounce(() => this.filterTable(e.target.value, searchId), 300);
                });
            }
        });
    }

    setupSearchHandler() {
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.debounce(() => this.handleSearch(e.target.value), 300);
            });
        }
    }

    setupTooltipHandler(viewer) {
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement) => {
            const pickedObject = viewer.scene.pick(movement.endPosition);
            if (Cesium.defined(pickedObject)) {
                const entity = pickedObject.id;
                if (entity) {
                    this.updateTooltip(entity, movement.endPosition);
                }
            } else {
                this.hideTooltip();
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
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
    
    generateBarContent(items, type) {
        return items.map(item => {
            if (type === 'meteorite') {
                const mass = this.formatMass(item.mass);
                return `<div class="bar-item" onclick="window.app.focusOnMeteorite('${item.id}')">
                    🌠 ${item.name} - ${mass}
                </div>`;
            } else {
                const diameter = item.properties['Crater diamter [km]'];
                return `<div class="bar-item" onclick="window.app.focusOnCrater('${item.properties.Name}')">
                    💥 ${item.properties.Name} - ${diameter} km
                </div>`;
            }
        }).join('');
    }

    hideTooltip() {
        if (this.elements.tooltip) {
            this.elements.tooltip.style.display = 'none';
        }
    }
    
    getTooltipContent(entity) {
        if (!entity || !entity.id) return null;
        
        if (entity.id.properties?.isMeteorite) {
            return this.getMeteoriteTooltip(entity.id.properties.meteorite);
        }
        
        if (entity.id.properties?.isImpactCrater) {
            return this.getCraterTooltip(entity.id.properties.crater);
        }
        
        return null;
    }
    
    getMeteoriteTooltip(meteorite) {
        return `
            <b>Name:</b> ${meteorite.name || 'Unknown'}<br>
            <b>Mass:</b> ${this.formatMass(meteorite.mass)}<br>
            <b>Class:</b> ${meteorite.recclass || 'Unknown'}<br>
            <b>Year:</b> ${meteorite.year ? new Date(meteorite.year).getFullYear() : 'Unknown'}
        `;
    }
    
    getCraterTooltip(crater) {
        return `
            <b>Name:</b> ${crater.Name || 'Unknown'}<br>
            <b>Diameter:</b> ${crater['Crater diamter [km]'] || 'Unknown'} km<br>
            <b>Age:</b> ${crater['Age [Myr]'] || 'Unknown'} Myr<br>
            <b>Location:</b> ${crater.Country || 'Unknown'}
        `;
    }
    
    formatMass(mass) {
        if (!mass) return 'Unknown';
        const numMass = parseFloat(mass);
        if (isNaN(numMass)) return 'Unknown';
        
        if (numMass >= 1000000) return `${(numMass/1000000).toFixed(2)} tonnes`;
        if (numMass >= 1000) return `${(numMass/1000).toFixed(2)} kg`;
        return `${numMass.toFixed(2)} g`;
    }


    updateDataBars(meteorites, craters) {
        // Update meteorite bar
        const topMeteorites = meteorites
            .filter(m => m.mass)
            .sort((a, b) => parseFloat(b.mass) - parseFloat(a.mass))
            .slice(0, 10);
    
        const meteoriteBar = document.getElementById('meteoriteBar');
        meteoriteBar.innerHTML = `
            <div class="bar-item"><strong>Top Meteorites:</strong></div>
            <div class="bar-item" onclick="window.openModal()"><strong>View All</strong></div>
            ${topMeteorites.map(m => `
                <div class="bar-item" onclick="window.app.focusOnMeteorite('${m.id}')">
                    🌠 ${m.name} - ${this.formatMass(m.mass)}
                </div>
            `).join('')}
        `;
    
        // Update crater bar
        const topCraters = craters
            .sort((a, b) => parseFloat(b.properties['Crater diamter [km]']) - parseFloat(a.properties['Crater diamter [km]']))
            .slice(0, 10);
    
        const craterBar = document.getElementById('craterBar');
        craterBar.innerHTML = `
            <div class="bar-item"><strong>Top Impact Craters:</strong></div>
            <div class="bar-item" onclick="window.openCraterModal()"><strong>View All</strong></div>
            ${topCraters.map(c => `
                <div class="bar-item" onclick="window.app.focusOnCrater('${c.properties.Name}')">
                    💥 ${c.properties.Name} - ${c.properties['Crater diamter [km]']} km
                </div>
            `).join('')}
        `;
    }

    updateMeteoriteBar(meteorites) {
        const content = this.generateBarContent(meteorites, 'meteorite');
        document.getElementById('meteoriteBar').innerHTML = `
            <div class="bar-item"><strong>Top Meteorites:</strong></div>
            <div class="bar-item" onclick="openModal()"><strong>View All</strong></div>
            ${content}
        `;
    }

    updateCraterBar(craters) {
        const content = this.generateBarContent(craters, 'crater');
        document.getElementById('craterBar').innerHTML = `
            <div class="bar-item"><strong>Top Impact Craters:</strong></div>
            <div class="bar-item" onclick="openCraterModal()"><strong>View All</strong></div>
            ${content}
        `;
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

console.log('UI module loaded');
