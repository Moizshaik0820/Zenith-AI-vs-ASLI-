import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from app import app
    print("SUCCESS: App initialized smoothly!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED:", e)
