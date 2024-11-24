import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from flask import Flask, render_template
from dotenv import load_dotenv
import os
from src.meteorites import MeteoriteHandler
from src.craters import CraterHandler
from src.utils import parse_age_string

app = Flask(__name__)
load_dotenv()

logger.debug("Starting application initialization")

# Wrap critical operations in try-except with logging
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
        return render_template(
            'index.html',
            cesium_token=app.config['CESIUM_ION_ACCESS_TOKEN'],
            impact_craters=crater_handler.get_all_craters()
        )
    except Exception as e:
        logger.error(f"Error rendering index: {str(e)}")
        raise

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
