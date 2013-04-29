import os
import shutil
import subprocess
from zipfile import ZipFile
from glob import glob

from conf import PROJ_ROOT
from util import download_if_not_exist, which, maybe_add_sudo

CLOSURE_ZIP_URL = ('https://closure-library.googlecode.com'
                   '/files/closure-library-20130212-95c19e7f0f5f.zip')
CLOSURE_ZIP = 'goog.zip'

JS_COMPILER_ZIP_URL = ('http://closure-compiler.googlecode.com'
                       '/files/compiler-latest.zip')
JS_COMPILER_ZIP = 'cc.zip'

SOY_ZIP_URL = ('http://closure-templates.googlecode.com'
               '/files/closure-templates-for-javascript-latest.zip')
SOY_ZIP = 'soycc.zip'

CSS_COMPILER_URL = ('https://closure-stylesheets.googlecode.com'
                    '/files/closure-stylesheets-20111230.jar')
CSS_COMPILER = 'closure-stylesheets.jar'

tasks = {}
def is_task(f):
    tasks[f.__name__] = f

@is_task
def bootstrap():
    tmp = PROJ_ROOT / 'tmp'
    try:
        os.mkdir(tmp)
    except OSError:
        pass
    
    # Downloading
    download_if_not_exist(CLOSURE_ZIP_URL, tmp / CLOSURE_ZIP)
    download_if_not_exist(JS_COMPILER_ZIP_URL, tmp / JS_COMPILER_ZIP)
    download_if_not_exist(SOY_ZIP_URL, tmp / SOY_ZIP)
    download_if_not_exist(CSS_COMPILER_URL, tmp / CSS_COMPILER)

    # Installing
    if not which('scss'):
        subprocss.call(maybe_add_sudo(['gem', 'install', 'scss']))

    with ZipFile(tmp / CLOSURE_ZIP) as f:
        f.extractall(tmp)
    with ZipFile(tmp / JS_COMPILER_ZIP_URL) as f:
        f.extractall(tmp)
    with ZipFile(tmp / SOY_ZIP) as f:
        f.extractall(tmp)

    shutil.copytree(tmp / 'third_party', PROJ_ROOT)
    shutil.copytree(tmp / 'closure' / 'goog', PROJ_ROOT / 'js')

    soyutilroot = PROJ_ROOT / 'js' / 'goog' / 'soyutil'
    try:
        os.makedirs(soyutilroot)
    except OSError:
        pass
    for filename in glob(tmp / 'soy*.js'):
        shutil.copy2(filename, soyutilroot)

@is_task
def build_css():
    pass

@is_task
def build_js():
    pass

@is_task
def compile_css_js():
    pass


