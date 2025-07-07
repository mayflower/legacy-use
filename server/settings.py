from pathlib import Path
from environs import Env

ROOT_DIR = Path(__file__).parent.parent

print('Root dir', ROOT_DIR)

env = Env()
env.read_env(ROOT_DIR / '.env')

print('API_KEY', env('API_KEY'))

print('Env', env.dump())

print('FAIL', env('FAIL'))
