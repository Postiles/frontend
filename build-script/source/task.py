import os
import shutil
import subprocess
from zipfile import ZipFile
from glob import glob
from cStringIO import StringIO

import logging
logger = logging.getLogger('task')

from conf import PROJ_ROOT
from util import download_if_not_exist, maybe_add_sudo
import util

JS_POSTILE = PROJ_ROOT / 'js' / 'postile'

CLOSURE_BIN_BUILD = (PROJ_ROOT / 'tmp' / 'closure' / 'bin' / 'build')

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
def reg_task(f):
    tasks[f.__name__] = f

@reg_task
def bootstrap():
    tmp = PROJ_ROOT / 'tmp'
    logger.info('Creating temporary directory at %s', tmp)
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
    if not util.which('scss'):
        logger.info('Installing scss')
        subprocss.call(maybe_add_sudo(['gem', 'install', 'scss']))

    with ZipFile(tmp / CLOSURE_ZIP) as f:
        logger.info('Extracting closure library')
        f.extractall(tmp)
    with ZipFile(tmp / JS_COMPILER_ZIP) as f:
        logger.info('Extracting closure compiler')
        f.extractall(tmp)
    with ZipFile(tmp / SOY_ZIP) as f:
        logger.info('Extracting closure template compiler')
        f.extractall(tmp)

    logger.info('Copying closure library into project tree')
    shutil.rmtree(PROJ_ROOT / 'third_party', True)
    shutil.copytree(tmp / 'third_party', PROJ_ROOT / 'third_party')
    shutil.rmtree(PROJ_ROOT / 'js' / 'goog', True)
    shutil.copytree(tmp / 'closure' / 'goog', PROJ_ROOT / 'js' / 'goog')

    soyutilroot = PROJ_ROOT / 'js' / 'goog' / 'soyutil'
    try:
        os.makedirs(soyutilroot)
    except OSError:
        pass
    for filename in glob(tmp / 'soy*.js'):
        shutil.copy2(filename, soyutilroot)

    logger.info('Done')

@reg_task
def build_css():
    logger.info('Cleaning up css generated from sass')
    scss_glob = PROJ_ROOT / 'css' / '*.scss'
    for name in glob(scss_glob):
        name = name.replace('.scss', '.css')
        try:
            os.unlink(name)
        except OSError:
            pass
    logger.info('Building up css from sass')
    subprocess.call(['sass', '--update'] + glob(scss_glob))

    logger.info('Building up css from gss')
    gss_glob = PROJ_ROOT / 'css' / '*.gss'
    for name in glob(gss_glob):
        subprocess.call(['java', '-jar', PROJ_ROOT / 'tmp' / CSS_COMPILER,
            '--pretty-print', name,
            '--output-file', name.replace('.gss', '-gen.css')])
    logger.info('Done')

@reg_task
def build_js():
    logger.info('Compiling closure templates')
    soys = list(util.find(JS_POSTILE, '*.soy'))
    subprocess.call(['java', '-jar',
        PROJ_ROOT / 'tmp' / 'SoyToJsSrcCompiler.jar',
        '--outputPathFormat', '{INPUT_DIRECTORY}/{INPUT_FILE_NAME}.js',
        '--shouldProvideRequireSoyNamespaces',
        '--srcs'] + soys)

    logger.info('Building deps.js')
    subprocess.call(['python', CLOSURE_BIN_BUILD / 'depswriter.py',
        '--root_with_prefix=%s %s' % (JS_POSTILE, '../postile'),
        '--output_file=%s' % (JS_POSTILE / 'deps.js')])

    logger.info('Adding soyutil to deps.js')
    with open(JS_POSTILE / 'deps.js', 'a') as fout:
        with open(PROJ_ROOT / 'hacks' / 'soyutil-deps.js') as fin:
            fout.write(fin.read())
    logger.info('Done')

@reg_task
def compile_css_js():
    css_out = PROJ_ROOT / 'css' / 'compiled-gen.css'
    logger.info('Cleaning up compiled css')
    try:
        os.unlink(css_out)
    except OSError:
        pass
    logger.info('Compiling css')
    cmds = (['java', '-jar', PROJ_ROOT / 'tmp' / CSS_COMPILER] +
        glob(PROJ_ROOT / 'css' / '*.css') +
        ['--allowed-non-standard-function', 'skewY',
         '--allowed-non-standard-function', 'radial-gradient',
         '--allowed-non-standard-function', '-webkit-radial-gradient',
         '--allowed-non-standard-function', '-moz-radial-gradient',
         '--output-file', css_out])
    subprocess.call(cmds)
    
    # To shut up js compiler's long log
    jsc_err = StringIO()

    logger.info('Compiling js')
    jsc_cmds = ['python',
        CLOSURE_BIN_BUILD / 'closurebuilder.py',
        '--root=%s' % (PROJ_ROOT / 'js'),
        '--root=%s' % (PROJ_ROOT / 'third_party'),
        '--namespace=postile.entry',
        '--output_mode=compiled',
        '--compiler_jar=%s' % (PROJ_ROOT / 'tmp' / 'compiler.jar'),
        '--compiler_flags=--compilation_level=SIMPLE_OPTIMIZATIONS',
        '--compiler_flags=--define=postile.conf.USING_COMPILED_CSS',
        '--output_file=%s' % (PROJ_ROOT / 'compiled.js')]
    try:
        subprocess.check_output(jsc_cmds, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        logger.error(e.output)
        logger.error(util.colorize('JS compilation failed', 'yellow'))
        return

    logger.info('Done')

@reg_task
def all():
    bootstrap()
    build_css()
    build_js()
    compile_css_js()

