#!/usr/bin/env python

""" Generate script for individual task.
"""
import os

from task import tasks
from conf import PROJ_ROOT

def content_template(task_name):
    return '''#!/usr/bin/env python
import sys
sys.path.insert(0, './source')
from task import tasks
tasks['%s']()
''' % task_name

def main():
    for name in tasks:
        path = PROJ_ROOT / 'build-script' / '%s.gen.py' % name
        with open(path, 'wb') as f:
            f.write(content_template(name))
            print('Generated %s' % path)
        os.chmod(path, 0755)

if __name__ == '__main__':
    main()

