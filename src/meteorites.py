
import json
from typing import List, Dict, Any
from .utils import format_mass

class MeteoriteHandler:
    def __init__(self):
        self.all_meteorites: List[Dict[str, Any]] = []
        self.filtered_meteorites: List[Dict[str, Any]] = []

    def fetch_meteorites(self) -> None:
        """Fetch meteorite data from NASA API"""
        url = 'https://data.nasa.gov/resource/gh4g-9sfh.json?$limit=50000'
        # Implementation moved from fetchAllMeteorites
        self.all_meteorites = self._fetch_data(url)
        self.apply_filters()

    def apply_filters(self, year_range=(860, 2023), mass_range=(0, 60000000), 
                     selected_classes=None) -> None:
        """Filter meteorites based on criteria"""
        year_min, year_max = year_range
        mass_min, mass_max = mass_range
        
        self.filtered_meteorites = [
            m for m in self.all_meteorites
            if self._meets_filter_criteria(m, year_min, year_max, mass_min, mass_max, selected_classes)
        ]

    def get_meteorite_description(self, meteorite: Dict[str, Any]) -> str:
        """Generate HTML description for meteorite tooltip"""
        lat, lon = self._get_coordinates(meteorite)
        mass = meteorite.get('mass', 'Unknown')
        mass_display = format_mass(float(mass)) if mass != 'Unknown' else 'Unknown'
        
        return f"""
            <b>Name:</b> {meteorite.get('name', 'Unknown')}<br>
            <b>ID:</b> {meteorite.get('id', 'Unknown')}<br>
            <b>Mass:</b> {mass_display}<br>
            <b>Class:</b> {meteorite.get('recclass', 'Unknown')}<br>
            <b>Year:</b> {self._get_year(meteorite)}<br>
            <b>Fall/Find:</b> {meteorite.get('fall', 'Unknown')}
        """

    @staticmethod
    def _get_coordinates(meteorite: Dict[str, Any]) -> tuple:
        """Extract coordinates from meteorite data"""
        if meteorite.get('geolocation'):
            geo = meteorite['geolocation']
            if geo.get('latitude') and geo.get('longitude'):
                return float(geo['latitude']), float(geo['longitude'])
            elif geo.get('coordinates') and len(geo['coordinates']) == 2:
                return float(geo['coordinates'][1]), float(geo['coordinates'][0])
        elif meteorite.get('reclat') and meteorite.get('reclong'):
            return float(meteorite['reclat']), float(meteorite['reclong'])
        return None, None

    @staticmethod
    def _get_year(meteorite: Dict[str, Any]) -> str:
        """Extract year from meteorite data"""
        if meteorite.get('year'):
            try:
                return str(int(float(meteorite['year'][:4])))
            except (ValueError, TypeError):
                return 'Unknown'
        return 'Unknown'

    @staticmethod
    def _meets_filter_criteria(meteorite: Dict[str, Any], year_min: int, year_max: int,
                             mass_min: float, mass_max: float, selected_classes: List[str]) -> bool:
        """Check if meteorite meets all filter criteria"""
        year = meteorite.get('year')
        if year:
            try:
                year = int(float(year[:4]))
                if not (year_min <= year <= year_max):
                    return False
            except (ValueError, TypeError):
                return False

        mass = meteorite.get('mass')
        if mass:
            try:
                mass = float(mass)
                if not (mass_min <= mass <= mass_max):
                    return False
            except (ValueError, TypeError):
                return False

        if selected_classes:
            if meteorite.get('recclass') not in selected_classes:
                return False

        return True
