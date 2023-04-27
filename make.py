import os
import glob
from distutils.dir_util import copy_tree
import shutil

cmd = 'tsc --outDir dist -w'
print('Building TypeScript: ' + cmd)
os.system(cmd)
copy_tree('./src', './dist')
#shutil.copytree(r'./src', r'./dist/src', dirs_exist_ok=True)
