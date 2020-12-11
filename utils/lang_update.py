##  Photini - a simple photo metadata editor.
##  http://github.com/jim-easterbrook/Photini
##  Copyright (C) 2020  Jim Easterbrook  jim@jim-easterbrook.me.uk
##
##  This program is free software: you can redistribute it and/or
##  modify it under the terms of the GNU General Public License as
##  published by the Free Software Foundation, either version 3 of the
##  License, or (at your option) any later version.
##
##  This program is distributed in the hope that it will be useful,
##  but WITHOUT ANY WARRANTY; without even the implied warranty of
##  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
##  General Public License for more details.
##
##  You should have received a copy of the GNU General Public License
##  along with this program.  If not, see
##  <http://www.gnu.org/licenses/>.

from __future__ import unicode_literals

from argparse import ArgumentParser
import os
import subprocess
import sys

from sphinx.application import Sphinx


def extract_program_strings(root, lang):
    src_dir = os.path.join(root, 'src', 'photini')
    dst_dir = os.path.join(root, 'src', 'lang')
    inputs = []
    for name in os.listdir(src_dir):
        base, ext = os.path.splitext(name)
        if ext == '.py':
            inputs.append(os.path.join(src_dir, name))
    inputs.sort()
    if lang:
        outputs = [os.path.join(dst_dir, 'photini.' + lang + '.ts')]
    else:
        outputs = []
        for name in os.listdir(dst_dir):
            if name.startswith('photini.'):
                outputs.append(os.path.join(dst_dir, name))
        outputs.sort()
    cmd = ['pylupdate5', '-verbose', '-noobsolete']
    cmd += inputs
    cmd.append('-ts')
    cmd += outputs
    return subprocess.call(cmd)


def extract_doc_strings(root, lang):
    # create / update .pot files with Sphinx
    src_dir = os.path.join(root, 'src', 'doc')
    dst_dir = os.path.join(root, 'src', 'lang', 'doc', 'pot', 'gettext')
    doctree_dir = os.path.join(root, 'doctrees', 'gettext')
    app = Sphinx(src_dir, src_dir, dst_dir, doctree_dir, 'gettext')
    app.build()
    # create / update .po files with Babel
    src_dir = dst_dir
    dst_dir = os.path.join(root, 'src', 'lang', 'doc')
    inputs = []
    for name in os.listdir(src_dir):
        base, ext = os.path.splitext(name)
        if ext == '.pot':
            inputs.append(os.path.join(src_dir, name))
    inputs.sort()
    if lang:
        locales = [lang]
    else:
        locales = []
        for name in os.listdir(dst_dir):
            if name != 'pot':
                locales.append(name)
    locales.sort()
    for locale in locales:
        for in_file in inputs:
            domain = os.path.splitext(os.path.basename(in_file))[0]
            out_file = os.path.join(
                dst_dir, locale, 'LC_MESSAGES', domain + '.po')
            if os.path.exists(out_file):
                cmd = ['pybabel', 'update']
            else:
                cmd = ['pybabel', 'init']
            cmd += ['--input-file', in_file, '--output-file', out_file,
                    '--locale', locale]
            result = subprocess.call(cmd)
            if result:
                return result
    return 0


def main(argv=None):
    if argv:
        sys.argv = argv
    parser = ArgumentParser(
        description='Extract strings for translation')
    parser.add_argument('-l', '--language',
                        help='language code, e.g. nl or cs_CZ')
    args = parser.parse_args()
    root = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    result = extract_program_strings(root, args.language)
    if result:
        return result
    result = extract_doc_strings(root, args.language)
    return result


if __name__ == "__main__":
    sys.exit(main())