"""Final mix: voice on top, music bed and place ambience underneath.

Both beds duck under the voice, the ambience a little harder than the music —
wind under a sentence should be felt, not listened to. Output lands at -14 LUFS,
which is what YouTube normalises Shorts to.
"""
import subprocess
from pathlib import Path


def duration(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(p)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def mix(video, voice, bed, out, ambience=None, bed_db=-9, amb_db=-13):
    secs = duration(video)
    inputs = ["-i", str(video), "-i", str(voice), "-i", str(bed)]
    filt = (
        "[1:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[v];"
        f"[2:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={bed_db}dB[m];"
    )
    if ambience:
        inputs += ["-i", str(ambience)]
        filt += (
            f"[3:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={amb_db}dB[amb];"
            "[v]asplit=3[v1][vsc1][vsc2];"
            "[m][vsc1]sidechaincompress=threshold=0.08:ratio=2:attack=30:release=400[md];"
            "[amb][vsc2]sidechaincompress=threshold=0.06:ratio=3:attack=20:release=500[ad];"
            "[v1][md][ad]amix=inputs=3:duration=first:normalize=0[mix];"
        )
    else:
        filt += (
            "[v]asplit=2[v1][vsc1];"
            "[m][vsc1]sidechaincompress=threshold=0.08:ratio=2:attack=30:release=400[md];"
            "[v1][md]amix=inputs=2:duration=first:normalize=0[mix];"
        )
    filt += "[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]"
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs,
         "-filter_complex", filt, "-map", "0:v:0", "-map", "[a]",
         "-t", f"{secs:.2f}", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-movflags", "+faststart", str(out)], check=True)
    return Path(out)
