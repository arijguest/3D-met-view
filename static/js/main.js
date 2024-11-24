import { MeteoriteManager } from './meteorites.js';
import { CraterManager } from './craters.js';
import { UIManager } from './ui.js';
import { CONFIG, COLOR_SCHEMES, FILTER_RANGES } from './constants.js';

class App {
    constructor() {
        console.log('Initializing App');
        this.init();
    }

    async init() {
        await this.initializeCesium();
        this.initializeManagers();
        this.setupEventHandlers();
        this.loadInitialData();
        this.setupColorSchemeHandlers();
        this.setupFilterHandlers();
    }

    async initializeCesium() {
        const token = window.CESIUM_TOKEN || CONFIG.CESIUM_TOKEN;
        Cesium.Ion.defaultAccessToken = token;
        
        this.viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: await Cesium.createWorldTerrainAsync(),
            baseLayerPicker: true,
            navigationHelpButton: true,
            sceneModePicker: true,
            animation: false,
            timeline: false,
            fullscreenButton: true,
            homeButton: true,
            geocoder: false,
            infoBox: false,
            selectionIndicator: false,
            navigationInstructionsInitiallyVisible: false
        });

        this.viewer.scene.globe.enableLighting = true;
        this.viewer.scene.globe.depthTestAgainstTerrain = false;
    }

    initializeManagers() {
        this.ui = new UIManager();
        this.meteorites = new MeteoriteManager(this.viewer);
        this.craters = new CraterManager(this.viewer);
        this.initializeFilters();
        this.initializeInfoMenu();
    }

    formatMass(mass) {
        if (mass === 'Unknown' || isNaN(mass)) return 'Unknown';
        if (mass >= 1000000) {
            return `${(mass / 1000000).toFixed(2)} tonnes`;
        } else if (mass >= 1000) {
            return `${(mass / 1000).toFixed(2)} kg`;
        }
        return `${mass} g`;
    }


    initializeFilters() {
        // Initialize year range
        const yearMin = document.getElementById('yearRangeMin');
        const yearMax = document.getElementById('yearRangeMax');
        yearMin.value = FILTER_RANGES.YEAR.MIN;
        yearMax.value = FILTER_RANGES.YEAR.MAX;
        
        // Initialize mass range
        const massMin = document.getElementById('massRangeMin');
        const massMax = document.getElementById('massRangeMax');
        massMin.value = FILTER_RANGES.MASS.MIN;
        massMax.value = FILTER_RANGES.MASS.MAX;
        
        // Initialize diameter range
        const diameterMin = document.getElementById('diameterRangeMin');
        const diameterMax = document.getElementById('diameterRangeMax');
        diameterMin.value = FILTER_RANGES.DIAMETER.MIN;
        diameterMax.value = FILTER_RANGES.DIAMETER.MAX;
        
        // Initialize age range
        const ageMin = document.getElementById('ageRangeMin');
        const ageMax = document.getElementById('ageRangeMax');
        ageMin.value = FILTER_RANGES.AGE.MIN;
        ageMax.value = FILTER_RANGES.AGE.MAX;
        
        this.updateFilterDisplays();
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

    initializeInfoMenu() {
        const infoButton = document.getElementById('infoButton');
        const infoModal = document.getElementById('infoModal');
        const closeInfoModal = document.getElementById('closeInfoModal');
        
        infoButton.onclick = () => {
            this.ui.closeOtherMenus('info');
            infoModal.style.display = 'block';
        };
        
        closeInfoModal.onclick = () => infoModal.style.display = 'none';
    }

    setupColorSchemeHandlers() {
        document.getElementById('meteoriteColorScheme').addEventListener('change', () => {
            this.meteorites.updateEntities();
            this.ui.updateMeteoriteLegend();
        });

        document.getElementById('craterColorScheme').addEventListener('change', () => {
            this.craters.updateEntities();
            this.ui.updateCraterLegend();
        });

        document.getElementById('resetColorSchemes').addEventListener('click', () => {
            document.getElementById('meteoriteColorScheme').value = 'DEFAULT';
            document.getElementById('craterColorScheme').value = 'BLUE_SCALE';
            this.meteorites.updateEntities();
            this.craters.updateEntities();
            this.ui.updateLegends();
        });
    }

    setupFilterHandlers() {
        document.getElementById('applyFiltersButton').addEventListener('click', () => this.applyFilters());
        document.getElementById('refreshButton').addEventListener('click', () => this.resetFilters());
        document.getElementById('toggleMeteorites').addEventListener('change', (e) => this.meteorites.setVisibility(e.target.checked));
        document.getElementById('toggleCraters').addEventListener('change', (e) => this.craters.setVisibility(e.target.checked));
        document.getElementById('clusterMeteorites').addEventListener('change', (e) => this.meteorites.setClusteringEnabled(e.target.checked));
    }

    setupEventHandlers() {
        // Modal handlers
        window.openModal = () => {
            document.getElementById('modal').style.display = 'block';
            this.updateModalTable();
        };
    
        window.openCraterModal = () => {
            document.getElementById('craterModal').style.display = 'block';
            this.updateCraterModalTable();
        };
    
        // Close button handlers
        document.querySelectorAll('.close-button').forEach(button => {
            button.onclick = () => {
                button.closest('.modal, #controls, #keyMenu, #infoModal').style.display = 'none';
            };
        });
    
        // Click outside to close
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        };
    }

    setupEntityInteraction() {
        this.screenSpaceHandler.setInputAction((movement) => {
            this.handleMouseMove(movement);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.screenSpaceHandler.setInputAction((click) => {
            this.handleEntityClick(click);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    async loadInitialData() {
        this.ui.showLoadingIndicator();
        try {
            await Promise.all([
                this.meteorites.fetchData(),
                this.craters.loadData()
            ]);
            this.applyFilters();
            this.updateDataBars();
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            this.ui.hideLoadingIndicator();
        }
    }

    handleCameraChange() {
        const altitude = this.viewer.camera.positionCartographic.height;
        this.meteorites.updateClustering(altitude);
    }

    handleMouseMove(movement) {
        const pickedObject = this.viewer.scene.pick(movement.endPosition);
        if (Cesium.defined(pickedObject)) {
            this.ui.updateTooltip(pickedObject, movement.endPosition);
        } else {
            this.ui.hideTooltip();
        }
    }

    handleEntityClick(click) {
        const pickedObject = this.viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject)) {
            this.focusOnEntity(pickedObject.id);
        }
    }

    applyFilters() {
        const filterState = {
            year: {
                min: parseInt(document.getElementById('yearRangeMin').value),
                max: parseInt(document.getElementById('yearRangeMax').value)
            },
            mass: {
                min: parseInt(document.getElementById('massRangeMin').value),
                max: parseInt(document.getElementById('massRangeMax').value)
            },
            diameter: {
                min: parseFloat(document.getElementById('diameterRangeMin').value),
                max: parseFloat(document.getElementById('diameterRangeMax').value)
            },
            age: {
                min: parseFloat(document.getElementById('ageRangeMin').value),
                max: parseFloat(document.getElementById('ageRangeMax').value)
            },
            meteoriteClasses: Array.from(document.getElementById('meteoriteClassSelect').selectedOptions).map(opt => opt.value),
            targetRocks: Array.from(document.getElementById('targetRockSelect').selectedOptions).map(opt => opt.value),
            craterTypes: Array.from(document.getElementById('craterTypeSelect').selectedOptions).map(opt => opt.value)
        };

        this.validateAndNormalizeRanges(filterState);
        
        const filteredMeteorites = this.meteorites.filterData(filterState);
        const filteredCraters = this.craters.filterData(filterState);

        this.meteorites.updateEntities(filteredMeteorites);
        this.craters.updateEntities(filteredCraters);
        this.updateDataBars();
        this.ui.updateFilterCounts(filteredMeteorites.length, filteredCraters.length);
    }

    updateDataBars() {
        this.ui.updateMeteoriteBar(this.meteorites.getTopMeteorites(10));
        this.ui.updateCraterBar(this.craters.getTopCraters(10));
    }

    focusOnMeteorite(id) {
        const meteorite = this.meteorites.filteredMeteorites.find(m => m.id === id);
        if (!meteorite) return;
    
        const coords = this.meteorites.getCoordinates(meteorite);
        if (!coords) return;
    
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                coords.longitude,
                coords.latitude,
                CONFIG.DEFAULT_ZOOM
            ),
            duration: 2
        });
    }
    
    focusOnCrater(name) {
        const crater = this.craters.filteredCraters.find(c => c.properties.Name === name);
        if (!crater) return;
    
        const coords = this.craters.getCoordinates(crater);
        if (!coords) return;
    
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                coords.longitude,
                coords.latitude,
                CONFIG.DEFAULT_ZOOM
            ),
            duration: 2
        });
    }

    validateAndNormalizeRanges(filterState) {
        for (const range of ['year', 'mass', 'diameter', 'age']) {
            if (filterState[range].min > filterState[range].max) {
                [filterState[range].min, filterState[range].max] = [filterState[range].max, filterState[range].min];
                document.getElementById(`${range}RangeMin`).value = filterState[range].min;
                document.getElementById(`${range}RangeMax`).value = filterState[range].max;
            }
        }
    }

    updateModalTable() {
        const tbody = document.querySelector('#fullMeteoriteTable tbody');
        const searchQuery = document.getElementById('meteoriteSearchInput').value.toLowerCase();
        
        tbody.innerHTML = this.meteorites.filteredMeteorites
            .filter(m => m.name.toLowerCase().includes(searchQuery))
            .map((meteorite, index) => `
                <tr data-index="${index}" onclick="window.app.focusOnMeteorite('${meteorite.id}')">
                    <td>${meteorite.name}</td>
                    <td>${this.formatMass(meteorite.mass)}</td>
                    <td>${meteorite.recclass || 'Unknown'}</td>
                    <td>${meteorite.year ? new Date(meteorite.year).getFullYear() : 'Unknown'}</td>
                    <td>${meteorite.fall || 'Unknown'}</td>
                    <td>${meteorite.id ? `<a href="https://www.lpi.usra.edu/meteor/metbull.php?code=${meteorite.id}" target="_blank">View</a>` : 'N/A'}</td>
                </tr>
            `).join('');
    }
    
    updateCraterModalTable() {
        const tbody = document.querySelector('#fullCraterTable tbody');
        const searchQuery = document.getElementById('craterSearchInput').value.toLowerCase();
        
        tbody.innerHTML = this.craters.filteredCraters
            .filter(c => c.properties.Name.toLowerCase().includes(searchQuery))
            .map((crater, index) => `
                <tr data-index="${index}" onclick="window.app.focusOnCrater('${crater.properties.Name}')">
                    <td><a href="https://impact-craters.com/craters_id${crater.properties.No}" target="_blank">${crater.properties.Name}</a></td>
                    <td>${crater.properties.Country || 'Unknown'}</td>
                    <td>${crater.properties['Age [Myr]'] || 'Unknown'}</td>
                    <td>${crater.properties['Crater diamter [km]'] || 'Unknown'}</td>
                    <td>${crater.properties['Crater type'] || 'Unknown'}</td>
                    <td>${crater.properties.Target || 'Unknown'}</td>
                </tr>
            `).join('');
    }

    resetFilters() {
        this.filterState = {
            year: { min: FILTER_RANGES.YEAR.MIN, max: FILTER_RANGES.YEAR.MAX },
            mass: { min: FILTER_RANGES.MASS.MIN, max: FILTER_RANGES.MASS.MAX },
            diameter: { min: FILTER_RANGES.DIAMETER.MIN, max: FILTER_RANGES.DIAMETER.MAX },
            age: { min: FILTER_RANGES.AGE.MIN, max: FILTER_RANGES.AGE.MAX },
            meteoriteClasses: [],
            targetRocks: [],
            craterTypes: []
        };
        this.applyFilters();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new App();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('App initialization failed:', error);
        throw error;
    }
});

export default App;
