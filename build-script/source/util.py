import os
import urllib2
import shutil

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
    with urllib2.urlopen(url) as fin:
        with open(out_path, 'w') as fout:
            shutil.copyfileobj(fin, fout)

def download_if_not_exist(url, out_path):
    if not os.path.isfile(out_path):
        download_url_to(url, out_path)

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

