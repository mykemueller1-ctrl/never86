#!/usr/bin/env python3
"""Assemble six real public demo screenshots into a captioned MP4 walkthrough.

Usage (PowerShell; replace paths with the real captures and FFmpeg executable):
  python scripts/render-operator-demo-video.py C:/demo/captures C:/demo/never86-demo.mp4 --ffmpeg C:/tools/ffmpeg.exe

Requires Python 3.10+ and an FFmpeg build with drawtext and libx264. No Python
packages are needed. This does not capture the browser or verify that images
contain only public, fictional data. Check the six inputs before rendering.

The output is 1920x1080, 30 fps, 60 seconds, without audio. Screenshots are fitted
proportionately without cropping. Captions occupy a separate lower band. Every
frame is labeled as a fictional sample and a captioned walkthrough. The output
is a sequence of still screenshots, not a recording of live interactions.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass


@dataclass(frozen=True)
class Scene:
    filename: str
    seconds: int
    lines: tuple[str, str]


SCENES = (
    Scene("01-vendor-prices.jpg", 8, (
        "Same cheese. Two vendors.",
        "Watch both prices move.",
    )),
    Scene("02-order-result.jpg", 12, (
        "$6 less on cheese.",
        "$6 more with delivery.",
    )),
    Scene("03-smaller-case.jpg", 10, (
        "A smaller case changes the order.",
        "Check the weight and the extra food.",
    )),
    Scene("04-handoff.jpg", 12, (
        "Ask what changed. Name an owner.",
        "Keep the reply.",
    )),
    Scene("05-labor-pour.jpg", 9, (
        "The shift ran two hours late.",
        "Find the reason before the next shift.",
    )),
    Scene("06-demo-link.jpg", 9, (
        "Try the Never86’d",
        "sample operator desk.",
    )),
)

FPS = 30
CANVAS_WIDTH = 1920
CANVAS_HEIGHT = 1080
SCREEN_WIDTH = 1780
SCREEN_HEIGHT = 790
SCREEN_TOP = 76
BACKGROUND = "0x25262A"
CREAM = "0xF8F6F2"
MUTED = "0xDFBBA2"


class RenderError(Exception):
    """An actionable input, FFmpeg, or output error."""


def arguments(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__.split("\n\n", 1)[0],
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Expected captures, in order:\n"
            + "\n".join(f"  {scene.filename} ({scene.seconds} seconds)" for scene in SCENES)
            + "\n\nThe captions describe the canonical fictional sample data. "
            "Do not substitute customer screenshots or different figures."
        ),
    )
    parser.add_argument("capture_dir", type=Path, help="Directory containing the six named JPEG captures")
    parser.add_argument("output", type=Path, help="Output MP4 path")
    parser.add_argument("--ffmpeg", type=Path, required=True, help="Explicit path to the FFmpeg executable")
    parser.add_argument("--font", type=Path, help="Optional TrueType/OpenType font file; an installed system font is used otherwise")
    parser.add_argument("--overwrite", action="store_true", help="Replace an existing output file after a successful render")
    parser.add_argument("--crf", type=int, default=18, choices=range(0, 52), metavar="0..51", help="H.264 quality; default 18")
    return parser.parse_args(argv)


def run_ffmpeg(executable: Path, arguments: list[str], cwd: Path | None = None) -> str:
    """Run an explicit binary with arguments, without involving a shell."""
    try:
        result = subprocess.run(
            [str(executable), *arguments],
            cwd=cwd,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
    except OSError as exc:
        raise RenderError(f"Could not run FFmpeg: {exc}") from exc
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()[-6000:]
        raise RenderError(f"FFmpeg failed (exit {result.returncode}).\n{detail}")
    return result.stdout + result.stderr


def font_path(explicit: Path | None) -> Path:
    if explicit is not None:
        resolved = explicit.expanduser().resolve()
        if not resolved.is_file():
            raise RenderError(f"The --font file does not exist: {resolved}")
        return resolved
    windows_fonts = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    candidates = (
        windows_fonts / "segoeuib.ttf",
        windows_fonts / "arialbd.ttf",
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
        Path("/Library/Fonts/Arial Bold.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
    )
    for candidate in candidates:
        if candidate.is_file():
            return candidate.resolve()
    raise RenderError("No suitable system font was found. Supply --font with a .ttf or .otf file.")


def validate(args: argparse.Namespace) -> tuple[Path, Path, Path, Path]:
    capture_dir = args.capture_dir.expanduser().resolve()
    output = args.output.expanduser().resolve()
    ffmpeg = args.ffmpeg.expanduser().resolve()
    if not capture_dir.is_dir():
        raise RenderError(f"Capture directory does not exist: {capture_dir}")
    missing = [scene.filename for scene in SCENES if not (capture_dir / scene.filename).is_file()]
    if missing:
        raise RenderError("Missing screenshot files:\n  " + "\n  ".join(missing))
    empty = [scene.filename for scene in SCENES if (capture_dir / scene.filename).stat().st_size == 0]
    if empty:
        raise RenderError("Empty screenshot files:\n  " + "\n  ".join(empty))
    if output.suffix.lower() != ".mp4":
        raise RenderError("The output path must end in .mp4.")
    if output.exists() and (not output.is_file() or not args.overwrite):
        raise RenderError(f"Output already exists. Choose a new path or use --overwrite: {output}")
    if not ffmpeg.is_file():
        raise RenderError(f"FFmpeg executable does not exist: {ffmpeg}")
    font = font_path(args.font)
    filters = run_ffmpeg(ffmpeg, ["-hide_banner", "-filters"])
    if not re.search(r"^\s*\S+\s+drawtext\s", filters, re.MULTILINE):
        raise RenderError("This FFmpeg build has no drawtext filter. Supply a build with drawtext support.")
    encoders = run_ffmpeg(ffmpeg, ["-hide_banner", "-encoders"])
    if not re.search(r"^\s*\S+\s+libx264\s", encoders, re.MULTILINE):
        raise RenderError("This FFmpeg build has no libx264 encoder. Supply a build with H.264 encoding support.")
    return capture_dir, output, ffmpeg, font


def draw_text(filename: str, *, size: int, x: str, y: int, color: str = CREAM) -> str:
    # Only helper-created ASCII basenames enter the filter graph. The working
    # directory contains font.ttf and each UTF-8 text file, so Windows drive
    # colons, spaces, apostrophes, and backslashes never need filter escaping.
    # expansion=none prevents percent signs in text from becoming expressions.
    return (
        f"drawtext=fontfile=font.ttf:textfile={filename}:expansion=none:"
        f"fontsize={size}:fontcolor={color}:x={x}:y={y}"
    )


def filter_graph(scene_number: int) -> str:
    # The original screenshot is scaled and centered inside a dedicated region.
    # All decorative elements and captions are outside that region.
    filters = [
        f"scale={SCREEN_WIDTH}:{SCREEN_HEIGHT}:force_original_aspect_ratio=decrease:flags=lanczos",
        "setsar=1",
        f"pad={CANVAS_WIDTH}:{CANVAS_HEIGHT}:(ow-iw)/2:{SCREEN_TOP}+({SCREEN_HEIGHT}-ih)/2:color={BACKGROUND}",
        f"drawbox=x=70:y=887:w=1780:h=2:color={MUTED}:t=fill",
        draw_text("brand.txt", size=26, x="70", y=23),
        draw_text("disclosure.txt", size=22, x="w-tw-70", y=25, color=MUTED),
        draw_text(f"scene-{scene_number:02d}-caption-1.txt", size=48, x="(w-tw)/2", y=919),
        draw_text(f"scene-{scene_number:02d}-caption-2.txt", size=48, x="(w-tw)/2", y=981),
        # A small progress marker belongs to the added band, not the screenshot.
        f"drawbox=x=70:y=1055:w={round(1780 * scene_number / len(SCENES))}:h=3:color={MUTED}:t=fill",
        "format=yuv420p",
    ]
    return ",".join(filters)


def render(args: argparse.Namespace) -> Path:
    capture_dir, output, ffmpeg, font = validate(args)
    if sum(scene.seconds for scene in SCENES) != 60:
        raise RenderError("Scene timings must total exactly 60 seconds.")
    output.parent.mkdir(parents=True, exist_ok=True)
    staged_output: Path | None = None
    try:
        with tempfile.TemporaryDirectory(prefix="n86-demo-render-") as temporary:
            work = Path(temporary)
            shutil.copyfile(font, work / "font.ttf")
            (work / "brand.txt").write_text("Never86’d", encoding="utf-8")
            (work / "disclosure.txt").write_text(
                "FICTIONAL SAMPLE  ·  CAPTIONED WALKTHROUGH", encoding="utf-8"
            )
            concat_lines: list[str] = []
            for index, scene in enumerate(SCENES, start=1):
                for line_number, caption in enumerate(scene.lines, start=1):
                    (work / f"scene-{index:02d}-caption-{line_number}.txt").write_text(caption, encoding="utf-8")
                clip_name = f"scene-{index:02d}.mp4"
                print(f"Rendering scene {index}/{len(SCENES)} ({scene.seconds}s): {scene.filename}", flush=True)
                run_ffmpeg(ffmpeg, [
                    "-hide_banner", "-nostdin", "-loglevel", "warning", "-y",
                    "-loop", "1", "-framerate", str(FPS),
                    "-i", str(capture_dir / scene.filename),
                    "-vf", filter_graph(index),
                    "-map", "0:v:0", "-an",
                    "-c:v", "libx264", "-preset", "medium", "-tune", "stillimage",
                    "-crf", str(args.crf), "-pix_fmt", "yuv420p",
                    "-r", str(FPS), "-frames:v", str(scene.seconds * FPS),
                    "-video_track_timescale", "30000",
                    clip_name,
                ], cwd=work)
                concat_lines.append(f"file '{clip_name}'")
            (work / "concat.txt").write_text("\n".join(concat_lines) + "\n", encoding="ascii")

            # Render to a uniquely named file on the destination filesystem.
            # A failed render leaves any existing final video untouched.
            descriptor, temporary_output = tempfile.mkstemp(
                prefix=".n86-demo-", suffix=".mp4", dir=output.parent
            )
            os.close(descriptor)
            staged_output = Path(temporary_output)
            run_ffmpeg(ffmpeg, [
                "-hide_banner", "-nostdin", "-loglevel", "warning", "-y",
                "-f", "concat", "-safe", "1", "-i", "concat.txt",
                "-map", "0:v:0", "-c:v", "copy", "-an",
                "-movflags", "+faststart",
                "-metadata", "title=Never86’d fictional sample walkthrough",
                "-metadata", "comment=Captioned walkthrough assembled from six static screenshots of fictional data. Not a live interaction recording. No audio.",
                str(staged_output),
            ], cwd=work)
        if output.exists() and not args.overwrite:
            raise RenderError(f"Output was created while rendering. Nothing was replaced: {output}")
        os.replace(staged_output, output)
        staged_output = None
        return output
    finally:
        if staged_output is not None:
            staged_output.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    args = arguments(argv)
    try:
        output = render(args)
    except (RenderError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Render interrupted.", file=sys.stderr)
        return 130
    print(f"Created captioned walkthrough: {output}")
    print("60 seconds | 1920x1080 | 30 fps | no audio | fictional sample")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
