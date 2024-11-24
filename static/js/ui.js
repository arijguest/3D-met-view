import { COLOR_SCHEMES } from './constants.js';

export class UIManager {
    constructor() {
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

    initializeFilters() {
        // Year range
        const yearMin = document.getElementById('yearRangeMin');
        const yearMax = document.getElementById('yearRangeMax');
        yearMin.value = FILTER_RANGES.YEAR.MIN;
        yearMax.value = FILTER_RANGES.YEAR.MAX;
    
        // Mass range
        const massMin = document.getElementById('massRangeMin');
        const massMax = document.getElementById('massRangeMax');
        massMin.value = FILTER_RANGES.MASS.MIN;
        massMax.value = FILTER_RANGES.MASS.MAX;
    
        // Diameter range
        const diameterMin = document.getElementById('diameterRangeMin');
        const diameterMax = document.getElementById('diameterRangeMax');
        diameterMin.value = FILTER_RANGES.DIAMETER.MIN;
        diameterMax.value = FILTER_RANGES.DIAMETER.MAX;
    
        this.updateFilterDisplay();
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
    const prefix = type === 'meteorite' ? '🌠' : '💥';
    let content = `<div class="bar-item"><strong>Top ${type === 'meteorite' ? 'Meteorites' : 'Craters'}:</strong></div>`;
    content += `<div class="bar-item"><strong>View All</strong></div>`;
    
    items.forEach(item => {
        const name = type === 'meteorite' ? item.name : item.properties.Name;
        const value = type === 'meteorite' ? this.formatMass(item.mass) : `${item.properties['Crater diamter [km]']} km`;
        content += `<div class="bar-item">${prefix} ${name} - ${value}</div>`;
    });
    
    return content;
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
        const meteoriteBar = document.getElementById('meteoriteBar');
        const craterBar = document.getElementById('craterBar');
        
        // Update meteorite bar
        const topMeteorites = meteorites
            .sort((a, b) => parseFloat(b.mass) - parseFloat(a.mass))
            .slice(0, 10);
        
        meteoriteBar.innerHTML = `
            <div class="bar-item"><strong>Top Meteorites:</strong></div>
            <div class="bar-item" onclick="openModal()"><strong>View All</strong></div>
            ${this.generateMeteoriteBarItems(topMeteorites)}
        `;
        
        // Update crater bar
        const topCraters = craters
            .sort((a, b) => parseFloat(b.properties['Crater diamter [km]']) - parseFloat(a.properties['Crater diamter [km]']))
            .slice(0, 10);
        
        craterBar.innerHTML = `
            <div class="bar-item"><strong>Top Impact Craters:</strong></div>
            <div class="bar-item" onclick="openCraterModal()"><strong>View All</strong></div>
            ${this.generateCraterBarItems(topCraters)}
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
