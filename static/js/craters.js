console.log('Craters module loading');

import { CONFIG, COLOR_SCHEMES, FILTER_RANGES } from './constants.js';

export class CraterManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = new Cesium.CustomDataSource('craters');
        this.allCraters = [];
        this.filteredCraters = [];
        this.entities = [];
        
        this.initializeDataSource();
    }

    initializeDataSource() {
        this.viewer.dataSources.add(this.dataSource);
    }

    async loadData() {
        this.allCraters = window.INITIAL_CRATERS.features;
        this.processAges();
        this.filteredCraters = [...this.allCraters];
        this.updateEntities(this.filteredCraters);
        return this.allCraters;
    }

    setVisibility(visible) {
        this.dataSource.show = visible;
    }
    
    processAges() {
        this.allCraters.forEach(crater => {
            const ageStr = crater.properties['Age [Myr]'];
            const [ageMin, ageMax] = this.parseAgeString(ageStr);
            crater.properties.age_min = ageMin ?? 0;
            crater.properties.age_max = ageMax ?? 2500;
        });
    }

    parseAgeString(ageStr) {
        if (!ageStr) return [null, null];
        
        const patterns = [
            { regex: /^(\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)/, handler: (m) => [
                parseFloat(m[1]) - parseFloat(m[2]),
                parseFloat(m[1]) + parseFloat(m[2])
            ]},
            { regex: /^~?(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/, handler: (m) => [
                parseFloat(m[1]),
                parseFloat(m[2])
            ]},
            { regex: /^[<>]?(\d+(?:\.\d+)?)/, handler: (m) => [0, parseFloat(m[1])]},
            { regex: /^~?(\d+(?:\.\d+)?)/, handler: (m) => [
                parseFloat(m[1]),
                parseFloat(m[1])
            ]}
        ];

        for (const { regex, handler } of patterns) {
            const match = ageStr.match(regex);
            if (match) return handler(match);
        }

        return [null, null];
    }

    filterData(filterState) {
        this.filteredCraters = this.allCraters.filter(feature => {
            const props = feature.properties;
            const diameter = parseFloat(props['Crater diamter [km]']) || 0;
            const age_min = props.age_min ?? filterState.age.min;
            const age_max = props.age_max ?? filterState.age.max;
            const targetRock = props.Target || 'Unknown';
            const craterType = props['Crater type'] || 'Unknown';

            const diameterMatch = diameter >= filterState.diameter.min && 
                                diameter <= filterState.diameter.max;
            const ageMatch = age_max >= filterState.age.min && 
                            age_min <= filterState.age.max;
            const rockMatch = filterState.targetRocks.length ? 
                             filterState.targetRocks.includes(targetRock) : true;
            const typeMatch = filterState.craterTypes.length ? 
                             filterState.craterTypes.includes(craterType) : true;

            return diameterMatch && ageMatch && rockMatch && typeMatch;
        });

        this.updateEntities(this.filteredCraters);
        return this.filteredCraters;
    }

    initializeCraterSliders() {
        const diameters = this.allCraters
            .map(c => parseFloat(c.properties['Crater diamter [km]']))
            .filter(d => !isNaN(d));
        
        const ages = this.allCraters
            .map(c => c.properties.age_max)
            .filter(a => !isNaN(a));
    
        const maxDiameter = Math.max(...diameters);
        const maxAge = Math.max(...ages);
    
        document.getElementById('diameterRangeMax').value = maxDiameter;
        document.getElementById('ageRangeMax').value = maxAge;
    }

    updateEntities(filteredData = this.filteredCraters) {
        this.dataSource.entities.removeAll();
        this.entities = [];

        filteredData.forEach(crater => {
            const entity = this.createEntity(crater);
            if (entity) this.entities.push(entity);
        });
    }

    createEntity(crater) {
        const coords = this.getCoordinates(crater);
        if (!coords) return null;

        const diameter = parseFloat(crater.properties['Crater diamter [km]']) || 1;
        
        return this.dataSource.entities.add({
            position: Cesium.Cartesian3.fromDegrees(coords.longitude, coords.latitude),
            point: {
                pixelSize: this.calculateSize(diameter),
                color: this.getColor(diameter),
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1
            },
            properties: {
                isImpactCrater: true,
                crater: crater.properties
            }
        });
    }

    getCoordinates(crater) {
        if (crater.geometry?.coordinates) {
            const [longitude, latitude] = crater.geometry.coordinates;
            return { longitude, latitude };
        }
        return null;
    }

    calculateSize(diameter) {
        if (diameter >= 300) return 25;
        if (diameter >= 200) return 22;
        if (diameter >= 100) return 18;
        if (diameter >= 50) return 14;
        if (diameter >= 10) return 10;
        return 7;
    }

    getColor(diameter) {
        const selectedScheme = document.getElementById('craterColorScheme').value.toUpperCase();
        const scheme = COLOR_SCHEMES[selectedScheme].craters;
        
        for (const { threshold, color } of scheme) {
            if (diameter >= threshold) return color;
        }
        return Cesium.Color.GRAY.withAlpha(0.8);
    }

    getCraterTooltip(crater) {
        const props = crater.properties;
        return `
            <b>Name:</b> ${props.Name || 'Unknown'}<br>
            <b>Diameter:</b> ${props['Crater diamter [km]'] || 'Unknown'} km<br>
            <b>Age:</b> ${props['Age [Myr]'] || 'Unknown'} Myr<br>
            <b>Country:</b> ${props.Country || 'Unknown'}<br>
            <b>Target:</b> ${props.Target || 'Unknown'}<br>
            <b>Type:</b> ${props['Crater type'] || 'Unknown'}<br>
        `;
    }
    
    getTopCraters(count = 10) {
        return [...this.filteredCraters]
            .sort((a, b) => {
                const diamA = parseFloat(a.properties['Crater diamter [km]']) || 0;
                const diamB = parseFloat(b.properties['Crater diamter [km]']) || 0;
                return diamB - diamA;
            })
            .slice(0, count);
    }

    setVisibility(visible) {
        this.dataSource.show = visible;
    }
}
