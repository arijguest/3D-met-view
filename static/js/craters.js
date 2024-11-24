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
        try {
            const response = await fetch('earth-impact-craters-v2.geojson');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            this.allCraters = data.features;
            this.processAges();
            return this.allCraters;
        } catch (error) {
            console.error('Error loading crater data:', error);
            return [];
        }
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
        const { diameter, age, targetRocks, craterTypes } = filterState;
        
        this.filteredCraters = this.allCraters.filter(crater => {
            const props = crater.properties;
            const craterDiameter = parseFloat(props['Crater diamter [km]']) || 0;
            const ageMin = props.age_min;
            const ageMax = props.age_max;
            const targetRock = props.Target || 'Unknown';
            const craterType = props['Crater type'] || 'Unknown';

            return (craterDiameter >= diameter.min && craterDiameter <= diameter.max) &&
                   (ageMax >= age.min && ageMin <= age.max) &&
                   (!targetRocks.length || targetRocks.includes(targetRock)) &&
                   (!craterTypes.length || craterTypes.includes(craterType));
        });

        return this.filteredCraters;
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
        const scheme = COLOR_SCHEMES[this.currentColorScheme || 'DEFAULT'].craters;
        for (const { threshold, color } of scheme) {
            if (diameter >= threshold) return color;
        }
        return Cesium.Color.GRAY.withAlpha(0.8);
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
}

