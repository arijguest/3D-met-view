from typing import Dict, Any, Optional
from .meteorites import MeteoriteHandler
from .craters import CraterHandler

class EventHandler:
    def __init__(self):
        self.meteorite_handler = MeteoriteHandler()
        self.crater_handler = CraterHandler()
        
    def handle_search(self, query: str) -> Dict[str, Any]:
        """Handle location search requests"""
        if not query.strip():
            return {'success': False, 'message': 'Empty search query'}
            
        try:
            # Implementation for location search
            return {'success': True, 'results': []}
        except Exception as e:
            return {'success': False, 'message': str(e)}

    def handle_filter_update(self, filter_type: str, filter_values: Dict[str, Any]) -> None:
        """Handle filter updates for both meteorites and craters"""
        if filter_type == 'meteorite':
            self.meteorite_handler.apply_filters(**filter_values)
        elif filter_type == 'crater':
            self.crater_handler.apply_filters(**filter_values)

    @staticmethod
    def close_other_menus(opened_menu: str) -> None:
        """Handle menu visibility"""
        menus = {
            'options': 'controls',
            'key': 'keyMenu',
            'info': 'infoModal'
        }
        for menu_type, menu_id in menus.items():
            if menu_type != opened_menu:
                # This would be handled by the frontend
                pass

