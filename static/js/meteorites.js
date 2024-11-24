import { CONFIG, COLOR_SCHEMES, FILTER_RANGES } from './constants.js';

console.group('Meteorite Module Initialization');
console.log('Loading meteorites module');

export class MeteoriteManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = new Cesium.CustomDataSource('meteorites');
        this.allMeteorites = [];
        this.filteredMeteorites = [];
        this.entities = [];
        this.clusteringEnabled = true;
        
        this.initializeDataSource();
    }

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

    // Turn on or off clustering (default on)
    setClusteringEnabled(enabled) {
        this.clusteringEnabled = enabled;
        this.dataSource.clustering.enabled = enabled;
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
        return this.allMeteorites.filter(m => {
            const year = m.year ? new Date(m.year).getFullYear() : null;
            const mass = m.mass ? parseFloat(m.mass) : null;
            const recclass = m.recclass || 'Unknown';

            const yearMatch = year ? (year >= filterState.year.min && year <= filterState.year.max) : true;
            const massMatch = mass ? (mass >= filterState.mass.min && mass <= filterState.mass.max) : true;
            const classMatch = filterState.meteoriteClasses.length ? 
                              filterState.meteoriteClasses.includes(recclass) : true;

            return yearMatch && massMatch && classMatch && this.hasValidCoordinates(m);
        });
    }

    hasValidCoordinates(meteorite) {
        let lat, lon;
        if (meteorite.geolocation) {
            if (meteorite.geolocation.latitude && meteorite.geolocation.longitude) {
                lat = parseFloat(meteorite.geolocation.latitude);
                lon = parseFloat(meteorite.geolocation.longitude);
            } else if (meteorite.geolocation.coordinates?.length === 2) {
                [lon, lat] = meteorite.geolocation.coordinates.map(parseFloat);
            }
        } else if (meteorite.reclat && meteorite.reclong) {
            lat = parseFloat(meteorite.reclat);
            lon = parseFloat(meteorite.reclong);
        }
        return !isNaN(lat) && !isNaN(lon);
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
        if (meteorite.geolocation) {
            if (meteorite.geolocation.latitude && meteorite.geolocation.longitude) {
                return {
                    latitude: parseFloat(meteorite.geolocation.latitude),
                    longitude: parseFloat(meteorite.geolocation.longitude)
                };
            } else if (meteorite.geolocation.coordinates && meteorite.geolocation.coordinates.length === 2) {
                return {
                    longitude: parseFloat(meteorite.geolocation.coordinates[0]),
                    latitude: parseFloat(meteorite.geolocation.coordinates[1])
                };
            }
        } else if (meteorite.reclat && meteorite.reclong) {
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

