import sys
import json

json.dump(json.load(sys.stdin), sys.stdout, indent=2)
