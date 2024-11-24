import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from flask import Flask, render_template, jsonify
from dotenv import load_dotenv
import os
from src.meteorites import MeteoriteHandler
from src.craters import CraterHandler
from src.utils import parse_age_string

app = Flask(__name__)
load_dotenv()

logger.debug("Starting application initialization")

try:
    CESIUM_TOKEN = os.getenv('CESIUM_ION_ACCESS_TOKEN')
    logger.debug(f"Retrieved CESIUM token: {'Present' if CESIUM_TOKEN else 'Missing'}")
    
    if not CESIUM_TOKEN:
        raise ValueError("CESIUM_ION_ACCESS_TOKEN environment variable is not set.")
    
    app.config['CESIUM_ION_ACCESS_TOKEN'] = CESIUM_TOKEN
    
    logger.debug("Initializing handlers")
    crater_handler = CraterHandler()
    meteorite_handler = MeteoriteHandler()
    logger.debug("Handlers initialized successfully")

except Exception as e:
    logger.error(f"Failed during initialization: {str(e)}")
    raise

@app.route('/')
def index():
    logger.debug("Processing index route request")
    try:
        crater_data = crater_handler.get_all_craters()
        logger.debug(f"Loaded {len(crater_data['features'])} crater features")
        
        return render_template(
            'index.html',
            cesium_token=app.config['CESIUM_ION_ACCESS_TOKEN'],
            impact_craters=crater_data
        )
    except Exception as e:
        logger.error(f"Error rendering index: {str(e)}")
        raise

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'crater_count': len(crater_handler.get_all_craters()['features']),
        'cesium_token_present': bool(app.config['CESIUM_ION_ACCESS_TOKEN'])
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
