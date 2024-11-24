import json
from typing import List, Dict, Any
from .utils import parse_age_string

class CraterHandler:
    def __init__(self, crater_file: str = 'static/data/earth-impact-craters.geojson'):
        self.crater_file = crater_file
        self.all_craters: List[Dict[str, Any]] = []
        self.filtered_craters: List[Dict[str, Any]] = []
        self.load_craters()

    def load_craters(self) -> None:
        try:
            with open(self.crater_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.all_craters = data['features']
                self._process_crater_ages()
        except FileNotFoundError:
            print(f"{self.crater_file} not found. Impact craters will not be displayed.")
            self.all_craters = []

    def _process_crater_ages(self) -> None:
        for crater in self.all_craters:
            age_str = crater['properties'].get('Age [Myr]', '')
            age_min, age_max = parse_age_string(age_str)
            crater['properties']['age_min'] = age_min if age_min is not None else 0
            crater['properties']['age_max'] = age_max if age_max is not None else 2500

    def apply_filters(self, diameter_range=(0, 300), age_range=(0, 3000),
                     target_rocks=None, crater_types=None) -> None:
        diameter_min, diameter_max = diameter_range
        age_min, age_max = age_range
        
        self.filtered_craters = [
            crater for crater in self.all_craters
            if self._meets_filter_criteria(crater, diameter_min, diameter_max,
                                         age_min, age_max, target_rocks, crater_types)
        ]

    def get_crater_description(self, crater: Dict[str, Any]) -> str:
        props = crater['properties']
        return f"""
            <b>Name:</b> {props.get('Name', 'Unknown')}<br>
            <b>Age:</b> {props.get('Age [Myr]', 'Unknown')} Myr<br>
            <b>Diameter:</b> {props.get('Crater diamter [km]', 'Unknown')} km<br>
            <b>Country:</b> {props.get('Country', 'Unknown')}<br>
            <b>Target:</b> {props.get('Target', 'Unknown')}<br>
            <b>Type:</b> {props.get('Crater type', 'Unknown')}<br>
        """

    @staticmethod
    def _meets_filter_criteria(crater: Dict[str, Any], diameter_min: float, diameter_max: float,
                             age_min: float, age_max: float, target_rocks: List[str],
                             crater_types: List[str]) -> bool:
        props = crater['properties']
        
        diameter = float(props.get('Crater diamter [km]', 0))
        if not (diameter_min <= diameter <= diameter_max):
            return False

        age_min_crater = props.get('age_min', 0)
        age_max_crater = props.get('age_max', 2500)
        if not (age_min <= age_max_crater and age_max >= age_min_crater):
            return False

        if target_rocks and props.get('Target') not in target_rocks:
            return False

        if crater_types and props.get('Crater type') not in crater_types:
            return False

        return True

    def get_all_craters(self):
        return {"type": "FeatureCollection", "features": self.all_craters}
