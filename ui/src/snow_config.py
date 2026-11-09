import os
from pathlib import Path

# Load .env file automatically
_checked = set()
for _dir in [Path.cwd(), Path(__file__).resolve().parent, Path(__file__).resolve().parent.parent]:
    if _dir in _checked:
        continue
    _checked.add(_dir)
    _env_path = _dir / '.env'
    if _env_path.is_file():
        try:
            with open(_env_path, 'r', encoding='utf-8') as _f:
                for _line in _f:
                    _line = _line.strip()
                    if _line and not _line.startswith('#') and '=' in _line:
                        _k, _v = _line.split('=', 1)
                        os.environ.setdefault(_k.strip(), _v.strip())
            break
        except Exception:
            pass

SNOW_URL = os.getenv('SNOW_INSTANCE_URL', '').rstrip('/')
SNOW_USER = os.getenv('SNOW_USERNAME', 'admin')
SNOW_PASSWORD = os.getenv('SNOW_PASSWORD', '')

AUTH_DATA = {
    'user_name': SNOW_USER,
    'user_password': SNOW_PASSWORD,
    'sys_action': 'sysverb_login'
}
