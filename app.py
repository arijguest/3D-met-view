from flask import Flask, render_template
from dotenv import load_dotenv
import os
from src.meteorites import MeteoriteHandler
from src.craters import CraterHandler
from src.utils import parse_age_string

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['CESIUM_ION_ACCESS_TOKEN'] = os.getenv('CESIUM_ION_ACCESS_TOKEN')
if not app.config['CESIUM_ION_ACCESS_TOKEN']:
    raise ValueError("CESIUM_ION_ACCESS_TOKEN environment variable is not set.")

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

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    return render_template('500.html'), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)

