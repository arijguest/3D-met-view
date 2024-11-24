import re
from typing import Tuple, Optional
from functools import wraps
import time

def parse_age_string(age_str: str) -> Tuple[Optional[float], Optional[float]]:
    """Parse age string into min and max values"""
    if not age_str:
        return None, None
        
    age_str = age_str.strip()
    patterns = [
        r'^(?P<age>\d+(\.\d+)?)\s*\±\s*(?P<uncertainty>\d+(\.\d+)?)',
        r'^~?(?P<min>\d+(\.\d+)?)-(?P<max>\d+(\.\d+)?)',
        r'^<?(?P<max>\d+(\.\d+)?)',
        r'^>?(?P<min>\d+(\.\d+)?)',
        r'^\~?(?P<age>\d+(\.\d+)?)'
    ]
    
    for pattern in patterns:
        match = re.match(pattern, age_str)
        if match:
            groups = match.groupdict()
            if 'age' in groups and groups['age']:
                age = float(groups['age'])
                uncertainty = float(groups.get('uncertainty', 0))
                return age - uncertainty, age + uncertainty
            elif 'min' in groups and 'max' in groups and groups['min'] and groups['max']:
                return float(groups['min']), float(groups['max'])
            elif 'min' in groups and groups['min']:
                return float(groups['min']), None
            elif 'max' in groups and groups['max']:
                return None, float(groups['max'])
    return None, None

def format_mass(mass: float) -> str:
    """Format mass value with appropriate units"""
    if mass >= 1000000:
        return f"{mass/1000000:.2f} tonnes"
    elif mass >= 1000:
        return f"{mass/1000:.2f} kg"
    return f"{mass:.0f} g"

def debounce(wait_time: float):
    """Decorator to debounce function calls"""
    def decorator(fn):
        last_called = [0.0]
        
        @wraps(fn)
        def debounced(*args, **kwargs):
            now = time.time()
            if now - last_called[0] >= wait_time:
                last_called[0] = now
                return fn(*args, **kwargs)
        return debounced
    return decorator

