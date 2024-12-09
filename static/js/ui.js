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
    
    // Add this method to UIManager
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

    // Update setupMenuHandlers with enhanced error prevention
    setupMenuHandlers() {
        const menuButtons = {
            'optionsButton': 'controls',
            'keyButton': 'keyMenu',
            'infoButton': 'infoModal'
        };
    
        Object.entries(menuButtons).forEach(([buttonId, menuId]) => {
            const button = document.getElementById(buttonId);
            const menu = document.getElementById(menuId);
            
            if (button && menu) {
                button.onclick = () => this.toggleMenu(menuId);
                const closeButton = menu.querySelector('.close-button');
                if (closeButton) {
                    closeButton.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (menu) menu.style.display = 'none';
                    };
                }
            }
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
        // Keep existing handlers
        this.setupMenuHandlers();
        this.setupModalHandlers();
        this.setupFilterHandlers();
        this.setupTableHandlers();
        this.setupSearchHandler();
        this.setupFullscreenHandler();

        // Check for clustering on/off
    document.getElementById('clusterMeteorites').addEventListener('change', (e) => {
        if (this.meteorites) {
            this.meteorites.setClusteringEnabled(e.target.checked);
        }
    });
    
        // Add enhanced filter handlers
        document.getElementById('applyFiltersButton').addEventListener('click', () => {
            this.showLoadingIndicator();
            requestAnimationFrame(() => {
                this.applyFilters();
                this.hideLoadingIndicator();
            });
        });
    
        document.getElementById('refreshButton').addEventListener('click', () => {
            this.showLoadingIndicator();
            requestAnimationFrame(() => {
                this.resetFilters();
                this.initializeFilters();
                this.applyFilters();
                this.hideLoadingIndicator();
            });
        });
    
        // Add visibility toggles
        document.getElementById('toggleMeteorites').addEventListener('change', (e) => {
            this.meteorites.setVisibility(e.target.checked);
        });
    
        document.getElementById('toggleCraters').addEventListener('change', (e) => {
            this.craters.setVisibility(e.target.checked);
        });
    
        // Add clustering toggle
        document.getElementById('clusterMeteorites').addEventListener('change', (e) => {
            this.meteorites.setClusteringEnabled(e.target.checked);
        });
    
        // Add color scheme handlers
        document.getElementById('meteoriteColorScheme').addEventListener('change', () => {
            this.updateMeteoriteLegend();
            this.applyFilters();
        });
    
        document.getElementById('craterColorScheme').addEventListener('change', () => {
            this.updateCraterLegend();
            this.applyFilters();
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

    setupEventHandlers() {
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
    
        // Modal handlers
        document.querySelectorAll('.view-all').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.dataset.type === 'meteorite' ? 'modal' : 'craterModal';
                document.getElementById(modalId).style.display = 'block';
            });
        });
    }

    setupModalHandlers() {
        // View All buttons
        const viewAllButtons = {
            'viewAllMeteorites': 'modal',
            'viewAllCraters': 'craterModal'
        };
    
        Object.entries(viewAllButtons).forEach(([buttonId, modalId]) => {
            document.getElementById(buttonId)?.addEventListener('click', () => {
                document.getElementById(modalId).style.display = 'block';
            });
        });
    
        // Close buttons
        document.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', () => {
                button.closest('.modal').style.display = 'none';
            });
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setupEventHandlers() {
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
    
        // Slider updates
        ['year', 'mass', 'diameter', 'age'].forEach(type => {
            const minSlider = document.getElementById(`${type}RangeMin`);
            const maxSlider = document.getElementById(`${type}RangeMax`);
            
            [minSlider, maxSlider].forEach(slider => {
                slider.addEventListener('input', () => {
                    this.updateRangeDisplay(type);
                });
            });
        });
    
        // Modal handlers
        document.querySelectorAll('.view-all').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.dataset.type === 'meteorite' ? 'modal' : 'craterModal';
                document.getElementById(modalId).style.display = 'block';
            });
        });
    }

    
    handleRangeEdit(type) {
        let newMin, newMax;
        const currentMin = document.getElementById(`${type}RangeMin`).value;
        const currentMax = document.getElementById(`${type}RangeMax`).value;
    
        switch(type) {
            case 'diameter':
                newMin = prompt(`Enter new minimum diameter (km):`, currentMin);
                newMax = prompt(`Enter new maximum diameter (km):`, currentMax);
                if (this.validateRange(newMin, newMax, 0, 300)) {
                    document.getElementById('diameterRangeMin').value = newMin;
                    document.getElementById('diameterRangeMax').value = newMax;
                }
                break;
            case 'age':
                newMin = prompt(`Enter new minimum age (Myr):`, currentMin);
                newMax = prompt(`Enter new maximum age (Myr):`, currentMax);
                if (this.validateRange(newMin, newMax, 0, 3000)) {
                    document.getElementById('ageRangeMin').value = newMin;
                    document.getElementById('ageRangeMax').value = newMax;
                }
                break;
            case 'year':
                newMin = prompt(`Enter new minimum year:`, currentMin);
                newMax = prompt(`Enter new maximum year:`, currentMax);
                if (this.validateRange(newMin, newMax, 860, 2023)) {
                    document.getElementById('yearRangeMin').value = newMin;
                    document.getElementById('yearRangeMax').value = newMax;
                }
                break;
            case 'mass':
                newMin = prompt(`Enter new minimum mass (g):`, currentMin);
                newMax = prompt(`Enter new maximum mass (g):`, currentMax);
                if (this.validateRange(newMin, newMax, 0, 60000000)) {
                    document.getElementById('massRangeMin').value = newMin;
                    document.getElementById('massRangeMax').value = newMax;
                }
                break;
        }
        this.updateRangeDisplay(type);
    }
    
    validateRange(min, max, absoluteMin, absoluteMax) {
        min = parseFloat(min);
        max = parseFloat(max);
        
        if (isNaN(min) || isNaN(max)) {
            alert('Please enter valid numbers');
            return false;
        }
        
        if (min < absoluteMin || max > absoluteMax || min > max) {
            alert(`Please enter values between ${absoluteMin} and ${absoluteMax} where min ≤ max`);
            return false;
        }
        
        return true;
    }


    updateRangeDisplay(type) {
        const min = document.getElementById(`${type}RangeMin`).value;
        const max = document.getElementById(`${type}RangeMax`).value;
        const display = document.getElementById(`${type}RangeValue`);
    
        switch(type) {
            case 'diameter':
                display.textContent = `${parseFloat(min).toFixed(2)} - ${parseFloat(max).toFixed(2)} km`;
                break;
            case 'age':
                display.textContent = `${parseFloat(min).toFixed(0)} - ${parseFloat(max).toFixed(0)} Myr`;
                break;
            case 'mass':
                display.textContent = `${this.formatMass(min)} - ${this.formatMass(max)}`;
                break;
            case 'year':
                display.textContent = `${parseInt(min)} - ${parseInt(max)}`;
                break;
        }
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
        if (!entity) return null;
        
        if (entity.properties?.isMeteorite) {
            const meteorite = this.meteorites.filteredMeteorites[entity.properties.meteoriteIndex];
            return `
                <b>Name:</b> ${meteorite.name || 'Unknown'}<br>
                <b>ID:</b> ${meteorite.id || 'Unknown'}<br>
                <b>Mass:</b> ${this.formatMass(meteorite.mass)}<br>
                <b>Class:</b> ${meteorite.recclass || 'Unknown'}<br>
                <b>Year:</b> ${meteorite.year ? new Date(meteorite.year).getFullYear() : 'Unknown'}<br>
                <b>Fall/Find:</b> ${meteorite.fall || 'Unknown'}
            `;
        }
        
        if (entity.properties?.isImpactCrater) {
            const crater = this.craters.filteredCraters[entity.properties.craterIndex];
            const props = crater.properties;
            return `
                <b>Name:</b> ${props.Name || 'Unknown'}<br>
                <b>Age:</b> ${props['Age [Myr]'] || 'Unknown'} Myr<br>
                <b>Diameter:</b> ${props['Crater diamter [km]'] || 'Unknown'} km<br>
                <b>Country:</b> ${props.Country || 'Unknown'}<br>
                <b>Target:</b> ${props.Target || 'Unknown'}<br>
                <b>Type:</b> ${props['Crater type'] || 'Unknown'}<br>
            `;
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
