import os
import urllib2
import shutil
from fnmatch import fnmatch

import logging
logger = logging.getLogger('util')

class FilePath(str):
    """ Represents a subclass of string that has its '/' operator
        overloaded as platform-independent path concatenation.
    """
    def __new__(cls, path):
        s = super(FilePath, cls).__new__(cls, path)
        return s

    def __div__(self, path):
        if isinstance(path, FilePath):
            path = path.path
        return FilePath(os.path.normpath(os.path.join(self, path)))

def download_url_to(url, out_path):
    logger.info('Downloading %s to %s', url, out_path)
    fin = urllib2.urlopen(url)
    with open(out_path, 'w') as fout:
        shutil.copyfileobj(fin, fout)

def download_if_not_exist(url, out_path):
    if not os.path.isfile(out_path):
        download_url_to(url, out_path)
    else:
        logger.info('Skip downloading of %s (cached)', url)

def which(program):
    """ Find full path of an executable, or None if not found.
        Copied from stackoverflow :)
    """
    def is_exe(fpath):
        return os.path.isfile(fpath) and os.access(fpath, os.X_OK)

    fpath, fname = os.path.split(program)
    if fpath:
        if is_exe(program):
            return program
    else:
        for path in os.environ['PATH'].split(os.pathsep):
            path = path.strip('"')
            exe_file = os.path.join(path, program)
            if is_exe(exe_file):
                return exe_file
    return None

def maybe_add_sudo(cmds):
    """ Add sudo if we are running on a posix system.
    """
    if os.name == 'posix':
        return ['sudo'] + cmds
    else:
        return cmds

def find(basedir, matcher):
    """ Recursive generate matched filename inside a given base directory.
    """
    for (dirpath, _, filenames) in os.walk(basedir):
        for filename in filenames:
            filepath = FilePath(dirpath) / filename
            if fnmatch(filepath, matcher):
                yield filepath

color_dict = {
    'black':  (30, 40),
    'red':    (31, 41),
    'green':  (32, 42),
    'yellow': (33, 43),
    'blue':   (34, 44),
    'magenta':(35, 45),
    'cyan':   (36, 46),
    'white':  (37, 47),
}

def colorize(s, color_name='red', fg=True):
    if os.name != 'posix':
        return s
    fgc, bgc = color_dict[color_name]
    if fg:
        return '\033[%dm' % fgc + s + '\033[0m'
    else:
        return '\033[%dm' % bgc + s + '\033[0m'

