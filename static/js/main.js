import { MeteoriteManager } from './meteorites.js';
import { CraterManager } from './craters.js';
import { UIManager } from './ui.js';
import { CONFIG, COLOR_SCHEMES, FILTER_RANGES } from './constants.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        await this.initializeCesium();
        this.initializeManagers();
        this.setupEventHandlers();
        this.loadInitialData();
        this.setupColorSchemeHandlers();
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
            document.getElementById('meteoriteColorScheme').value = 'Default';
            document.getElementById('craterColorScheme').value = 'Blue Scale';
            this.meteorites.updateEntities();
            this.craters.updateEntities();
            this.ui.updateLegends();
        });
    setupFilterHandlers() {
        document.getElementById('applyFiltersButton').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('refreshButton').addEventListener('click', () => {
            this.resetFilters();
        });

        // Toggle visibility handlers
        document.getElementById('toggleMeteorites').addEventListener('change', (e) => {
            this.meteorites.setVisibility(e.target.checked);
        });

        document.getElementById('toggleCraters').addEventListener('change', (e) => {
            this.craters.setVisibility(e.target.checked);
        });

        document.getElementById('clusterMeteorites').addEventListener('change', (e) => {
            this.meteorites.setClusteringEnabled(e.target.checked);
        });
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
        
        this.filterState = {
            year: { min: FILTER_RANGES.YEAR.MIN, max: FILTER_RANGES.YEAR.MAX },
            mass: { min: FILTER_RANGES.MASS.MIN, max: FILTER_RANGES.MASS.MAX },
            diameter: { min: FILTER_RANGES.DIAMETER.MIN, max: FILTER_RANGES.DIAMETER.MAX },
            age: { min: FILTER_RANGES.AGE.MIN, max: FILTER_RANGES.AGE.MAX },
            meteoriteClasses: [],
            targetRocks: [],
            craterTypes: []
        };
    }

    setupEventHandlers() {
        this.viewer.camera.changed.addEventListener(() => {
            this.handleCameraChange();
        });

        this.screenSpaceHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.setupEntityInteraction();

        document.getElementById('applyFiltersButton').addEventListener('click', () => {
            this.ui.showLoadingIndicator();
            requestAnimationFrame(() => {
                this.applyFilters();
                this.ui.hideLoadingIndicator();
            });
        });

        document.getElementById('fullscreenButton').addEventListener('click', () => {
            this.toggleFullscreen();
        });
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
        const filteredMeteorites = this.meteorites.filterData(this.filterState);
        const filteredCraters = this.craters.filterData(this.filterState);

        this.meteorites.updateEntities(filteredMeteorites);
        this.craters.updateEntities(filteredCraters);
        this.updateDataBars();
        this.ui.updateFilterCounts(filteredMeteorites.length, filteredCraters.length);
    }

    updateDataBars() {
        this.ui.updateMeteoriteBar(this.meteorites.getTopMeteorites(10));
        this.ui.updateCraterBar(this.craters.getTopCraters(10));
    }

    focusOnEntity(entity) {
        if (!entity) return;

        const position = entity.position.getValue(Cesium.JulianDate.now());
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(
                position.x,
                position.y,
                CONFIG.DEFAULT_ZOOM
            ),
            duration: 2
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.getElementById('wrapper').requestFullscreen();
        } else {
            document.exitFullscreen();
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
        this.ui.updateDataBars(filteredMeteorites, filteredCraters);
        this.ui.updateFilterCounts(filteredMeteorites.length, filteredCraters.length);
    }

    validateAndNormalizeRanges(filterState) {
        // Swap min/max if needed
        for (const range of ['year', 'mass', 'diameter', 'age']) {
            if (filterState[range].min > filterState[range].max) {
                [filterState[range].min, filterState[range].max] = 
                [filterState[range].max, filterState[range].min];
                
                document.getElementById(`${range}RangeMin`).value = filterState[range].min;
                document.getElementById(`${range}RangeMax`).value = filterState[range].max;
            }
        }
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
