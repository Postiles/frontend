import os

import logging
logging.basicConfig(level=logging.INFO)

from util import FilePath

# Define postile's root dir
PROJ_ROOT = FilePath(os.path.dirname(os.path.abspath(__file__))) / '../../'

