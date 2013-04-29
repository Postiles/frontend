import random
from util import FilePath, which, download_url_to, download_if_not_exist

def test_filepath():
    a = FilePath('/')
    assert a / '..' == '/'
    assert a / 'foo' == '/foo'
    assert a / 'foo' / 'bar' == '/foo/bar'

def test_which():
    assert which('ls') == '/bin/ls'
    assert which('THIS-IS-SPARTA') is None

