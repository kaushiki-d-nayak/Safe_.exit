"""Create a portable, credential-free snapshot of the complete project source."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
output = root / 'public' / 'safeexit-codebase.zip'
files = [root / name for name in (
    'package.json', 'package-lock.json', 'netlify.toml', 'drizzle.config.ts',
    'README.md', 'AGENTS.md', '.gitignore',
)]
for directory in ('public', 'db', 'netlify/functions', 'netlify/database/migrations', 'scripts'):
    files.extend(path for path in (root / directory).rglob('*') if path.is_file())
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(set(files)):
        if path == output or path.is_symlink() or path.name.startswith('.env') or '__pycache__' in path.parts:
            continue
        archive.write(path, Path('safeexit') / path.relative_to(root))
print('Created public/safeexit-codebase.zip')
