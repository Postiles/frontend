import os

from task import tasks

def run_task(name):
    try:
        tasks[name]()
    finally:
        if os.name == 'nt':
            # If nt: don't close the window
            raw_input('Press any key to continue..')

