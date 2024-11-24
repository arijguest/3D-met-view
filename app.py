from flask import Flask, render_template
from dotenv import load_dotenv
import os
from src.meteorites import MeteoriteHandler
from src.craters import CraterHandler
from src.utils import parse_age_string

# Initialize Flask before loading environment variables
app = application = Flask(__name__)

# Load environment variables
load_dotenv()

# Configuration with error catching
CESIUM_TOKEN = os.getenv('CESIUM_ION_ACCESS_TOKEN')
if not CESIUM_TOKEN:
    raise ValueError("CESIUM_ION_ACCESS_TOKEN environment variable is not set.")

app.config['CESIUM_ION_ACCESS_TOKEN'] = CESIUM_TOKEN

# Initialize handlers
crater_handler = CraterHandler()
meteorite_handler = MeteoriteHandler()

@app.route('/')
def index():
    """Render the main application page"""
    return render_template(
        'index.html',
        cesium_token=app.config['CESIUM_ION_ACCESS_TOKEN'],
        impact_craters=crater_handler.get_all_craters()
    )

# Production-ready server configuration
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
