"""Make the Projects page's images from references/projects-section/.

  use-this-for-thumbnail/   the scrolling list's pictures (5:4)  -> <project>-thumb.webp
  after-thumbnail-click/    the square poster on a project's page -> <project>-poster.webp

Both go to src/assets/projects/. A file is matched to a project by a word in its name
(see PROJECTS). A project with a poster but no thumbnail gets its thumbnail cropped
from the poster.

Setup (once):  python -m pip install pillow
Run:           python scripts/make_project_media.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'references' / 'projects-section'
OUT = ROOT / 'src' / 'assets' / 'projects'

THUMB_WIDTH = 1200
POSTER_WIDTH = 1000

# A word in the file name -> the project's name (its title in lowercase with dashes, as
# src/resume/projectMedia.ts looks it up).
PROJECTS = {
    'thumb': {
        'honda': 'mycarboy',
        'backpack': 'schoolnest',
        'soccer': 'marina-fc-website',
        'disco': 'musica',
        'radio': 'find-iss',
        'vr': 'vr-de-addiction-wellness',
    },
    'poster': {
        'mycarboy': 'mycarboy',
        'schoolnest': 'schoolnest',
        'vr': 'vr-de-addiction-wellness',
        'marina': 'marina-fc-website',
        'musica': 'musica',
        'find-iss': 'find-iss',
    },
}


def project_for(path: Path, kind: str) -> str | None:
    words = path.stem.lower().replace('_', ' ').replace(':', ' ').split()
    return next((name for key, name in PROJECTS[kind].items() if key in words), None)


def crop_to(image: Image.Image, ratio: float) -> Image.Image:
    """Centre-crop to width / height = ratio."""
    w, h = image.size
    if w / h > ratio:
        nw = round(h * ratio)
        return image.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    nh = round(w / ratio)
    return image.crop((0, (h - nh) // 2, w, (h + nh) // 2))


def save(image: Image.Image, width: int, name: str) -> None:
    image = image.convert('RGB')
    image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    target = OUT / f'{name}.webp'
    image.save(target, 'WEBP', quality=82, method=6)
    print(f'wrote  {target.relative_to(ROOT)}  {image.size}  {target.stat().st_size // 1024} KB')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    thumbs = set()
    for path in sorted((SOURCE / 'use-this-for-thumbnail').glob('*.png')):
        name = project_for(path, 'thumb')
        if not name:
            print(f'skip   {path.name}')
            continue
        save(crop_to(Image.open(path), 5 / 4), THUMB_WIDTH, f'{name}-thumb')
        thumbs.add(name)
    for path in sorted((SOURCE / 'after-thumbnail-click').glob('*.png')):
        name = project_for(path, 'poster')
        if not name:
            print(f'skip   {path.name}')
            continue
        poster = Image.open(path)
        save(crop_to(poster, 1), POSTER_WIDTH, f'{name}-poster')
        if name not in thumbs:
            save(crop_to(poster, 5 / 4), THUMB_WIDTH, f'{name}-thumb')


if __name__ == '__main__':
    main()
