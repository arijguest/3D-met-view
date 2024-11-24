console.log('Constants loaded:', {
    CONFIG,
    COLOR_SCHEMES,
    FILTER_RANGES
});

export const CONFIG = {
    CESIUM_TOKEN: window.CESIUM_TOKEN,
    API_URL: 'https://data.nasa.gov/resource/gh4g-9sfh.json',
    API_LIMIT: 50000,
    DEFAULT_ZOOM: 1000000,
    CLUSTERING: {
        PIXEL_RANGE: 45,
        MIN_CLUSTER_SIZE: 10,
        ALTITUDE_THRESHOLD: 500000
    }
};

export const COLOR_SCHEMES = {
    DEFAULT: {
        meteorites: [
            { threshold: 500000, color: Cesium.Color.RED.withAlpha(0.6) },
            { threshold: 100000, color: Cesium.Color.ORANGE.withAlpha(0.6) },
            { threshold: 50000, color: Cesium.Color.YELLOW.withAlpha(0.6) },
            { threshold: 10000, color: Cesium.Color.LIGHTYELLOW.withAlpha(0.6) },
            { threshold: 5000, color: Cesium.Color.WHITE.withAlpha(0.6) }
        ],
        craters: [
            { threshold: 200, color: Cesium.Color.RED.withAlpha(0.8) },
            { threshold: 100, color: Cesium.Color.ORANGE.withAlpha(0.8) },
            { threshold: 50, color: Cesium.Color.YELLOW.withAlpha(0.8) },
            { threshold: 10, color: Cesium.Color.LIGHTYELLOW.withAlpha(0.8) },
            { threshold: 5, color: Cesium.Color.MINTCREAM.withAlpha(0.8) }
        ]
    },
    BLUE_SCALE: {
        meteorites: [
            { threshold: 500000, color: Cesium.Color.DARKBLUE.withAlpha(0.6) },
            { threshold: 100000, color: Cesium.Color.BLUE.withAlpha(0.6) },
            { threshold: 50000, color: Cesium.Color.SKYBLUE.withAlpha(0.6) },
            { threshold: 10000, color: Cesium.Color.CYAN.withAlpha(0.6) },
            { threshold: 5000, color: Cesium.Color.LIGHTCYAN.withAlpha(0.6) }
        ],
        craters: [
            { threshold: 200, color: Cesium.Color.DARKBLUE.withAlpha(0.8) },
            { threshold: 100, color: Cesium.Color.BLUE.withAlpha(0.8) },
            { threshold: 50, color: Cesium.Color.SKYBLUE.withAlpha(0.8) },
            { threshold: 10, color: Cesium.Color.LIGHTBLUE.withAlpha(0.8) },
            { threshold: 5, color: Cesium.Color.MINTCREAM.withAlpha(0.8) }
        ]
    }
};

export const FILTER_RANGES = {
    YEAR: { MIN: 860, MAX: 2023 },
    MASS: { MIN: 0, MAX: 60000000 },
    DIAMETER: { MIN: 0, MAX: 300 },
    AGE: { MIN: 0, MAX: 3000 }
};

export const DOM_ELEMENTS = {
    CONTROLS: 'controls',
    KEY_MENU: 'keyMenu',
    INFO_MODAL: 'infoModal',
    LOADING: 'loadingIndicator',
    TOOLTIP: 'tooltip'
};

export const ANIMATION_DURATIONS = {
    CAMERA_FLIGHT: 2,
    HIGHLIGHT: 2000,
    FADE: 200
};

export const SIZE_THRESHOLDS = {
    METEORITE: {
        MIN: 5,
        MAX: 20,
        SCALE_FACTOR: 10000
    },
    CRATER: {
        HUGE: { size: 25, threshold: 300 },
        LARGE: { size: 22, threshold: 200 },
        MEDIUM: { size: 18, threshold: 100 },
        SMALL: { size: 14, threshold: 50 },
        TINY: { size: 10, threshold: 10 },
        DEFAULT: 7
    }
};

