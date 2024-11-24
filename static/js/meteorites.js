console.group('Meteorite Module Initialization');
console.log('Loading meteorites module');

import { CONFIG, COLOR_SCHEMES, FILTER_RANGES } from './constants.js';

export class MeteoriteManager {
    constructor(viewer) {
        console.log('Initializing MeteoriteManager');
        this.viewer = viewer;
        this.dataSource = new Cesium.CustomDataSource('meteorites');
        this.allMeteorites = [];
        this.filteredMeteorites = [];
        this.entities = [];
        this.clusteringEnabled = true;
        
        this.initializeDataSource();
    }

    console.log('Meteorite module loaded successfully');
    console.groupEnd();

    initializeDataSource() {
        this.viewer.dataSources.add(this.dataSource);
        this.setupClustering();
    }

    setupClustering() {
        this.dataSource.clustering.enabled = true;
        this.dataSource.clustering.pixelRange = 45;
        this.dataSource.clustering.minimumClusterSize = 10;
        
        this.dataSource.clustering.clusterEvent.addEventListener((clusteredEntities, cluster) => {
            cluster.label.show = false;
            cluster.billboard.show = true;
            cluster.billboard.id = cluster;
            cluster.billboard.image = this.createClusterIcon(clusteredEntities.length);
        });
    }

    async fetchData() {
        try {
            const response = await fetch(`${CONFIG.API_URL}?$limit=${CONFIG.API_LIMIT}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            this.allMeteorites = await response.json();
            return this.allMeteorites;
        } catch (error) {
            console.error('Error fetching meteorite data:', error);
            return [];
        }
    }

    filterData(filterState) {
        const { year, mass, meteoriteClasses } = filterState;
        
        this.filteredMeteorites = this.allMeteorites.filter(meteorite => {
            const meteYear = meteorite.year ? new Date(meteorite.year).getFullYear() : null;
            const meteClass = meteorite.recclass || 'Unknown';
            const meteMass = meteorite.mass ? parseFloat(meteorite.mass) : null;

            return (!meteYear || (meteYear >= year.min && meteYear <= year.max)) &&
                   (!meteMass || (meteMass >= mass.min && meteMass <= mass.max)) &&
                   (!meteoriteClasses.length || meteoriteClasses.includes(meteClass));
        });

        return this.filteredMeteorites;
    }

    updateEntities(filteredData = this.filteredMeteorites) {
        this.dataSource.entities.removeAll();
        this.entities = [];

        filteredData.forEach(meteorite => {
            const coords = this.getCoordinates(meteorite);
            if (coords) {
                const entity = this.createEntity(meteorite, coords);
                this.entities.push(entity);
            }
        });
    }

    createEntity(meteorite, coords) {
        const mass = parseFloat(meteorite.mass) || 0;
        return this.dataSource.entities.add({
            position: Cesium.Cartesian3.fromDegrees(coords.longitude, coords.latitude),
            point: {
                pixelSize: this.calculateSize(mass),
                color: this.getColor(mass),
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1
            },
            properties: {
                isMeteorite: true,
                meteorite: meteorite
            }
        });
    }

    getCoordinates(meteorite) {
        if (meteorite.geolocation?.latitude && meteorite.geolocation?.longitude) {
            return {
                latitude: parseFloat(meteorite.geolocation.latitude),
                longitude: parseFloat(meteorite.geolocation.longitude)
            };
        }
        if (meteorite.reclat && meteorite.reclong) {
            return {
                latitude: parseFloat(meteorite.reclat),
                longitude: parseFloat(meteorite.reclong)
            };
        }
        return null;
    }

    calculateSize(mass) {
        return Math.min(Math.max(mass / 10000, 5), 20);
    }

    getColor(mass) {
        const scheme = COLOR_SCHEMES[this.currentColorScheme || 'DEFAULT'].meteorites;
        for (const { threshold, color } of scheme) {
            if (mass >= threshold) return color;
        }
        return Cesium.Color.GRAY.withAlpha(0.6);
    }

    createClusterIcon(clusterSize) {
        const canvas = document.createElement('canvas');
        const size = 20 + (clusterSize.toString().length * 5);
        canvas.width = canvas.height = size;
        
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(255, 165, 0, 0.7)';
        context.beginPath();
        context.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
        context.fill();
        
        context.fillStyle = 'black';
        context.font = `bold ${10 + (clusterSize.toString().length * 2)}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(clusterSize, size/2, size/2);
        
        return canvas.toDataURL();
    }

    updateClustering(altitude) {
        this.dataSource.clustering.enabled = altitude > 500000 && this.clusteringEnabled;
    }

    getTopMeteorites(count = 10) {
        return [...this.filteredMeteorites]
            .filter(m => m.mass)
            .sort((a, b) => parseFloat(b.mass) - parseFloat(a.mass))
            .slice(0, count);
    }
}

