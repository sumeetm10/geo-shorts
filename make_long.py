"""Long-form (16:9) videos for AtlasOnFoot, built chapter by chapter.

    python make_long.py blackhole --free --props   free voice, timings only (fast)
    python make_long.py blackhole --free           full render with the free voice (preview)
    python make_long.py blackhole                  acted voice per chapter + render
    python make_long.py blackhole --reuse          re-render, keeping each chapter's voice
    python make_long.py blackhole --only 2,5 --strict-voice   re-voice + re-render chapters 2 and 5 (main TTS model only)

Each chapter is its own 1920x1080 composition (remotion/src/shots/long/BHL*.tsx)
with its own narration, so a chapter can be fixed and re-rendered alone
(`--only 3`). Chapters are joined, the voice tracks laid end to end, one music
bed under all of it, and the description gets chapter timestamps.

Every number in the script is checked against Wikipedia at build time
(`facts`, exact phrases), as in make_whatif.py.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import mix  # noqa: E402
import narrate  # noqa: E402
import score  # noqa: E402
import wiki  # noqa: E402
from make_walk import render  # noqa: E402

PAD = 0.9                     # silence after each chapter's last line

LONGS = {
    "blackhole": dict(
        title="What Actually Happens If You Fall Into a Black Hole?",
        tone="curious", seed=301,
        chapters=[
            dict(comp="BHLOpen", name="Two answers", lines=[
                ("Imagine falling into a black hole.", "hook"),
                ("Here's the strange part. Two completely different things would happen to you. And both of them are true.", "reveal"),
                ("In one, you fall straight through. In the other, you stop at the edge, and hang there, forever.", "cold"),
                ("By the end of this video, you'll know exactly how that works.", "walk"),
                ("And to understand it, we need to start with the Sun.", "walk"),
            ], at=dict(strange=1, versions=2, promise=3, sun=4), facts={}),
            dict(comp="BHLMake", name="How to make a black hole", lines=[
                ("A black hole is something so compact that nothing, not even light, can escape its gravity.", "reveal"),
                ("The maths for it was found in 1916, by Karl Schwarzschild, while he was serving in the army during the First World War.", "walk"),
                ("And it says almost anything can become a black hole, if you squeeze it hard enough.", "walk"),
                ("Squeeze the Sun, all 1.4 million kilometres of it, into a ball about 6 kilometres across, and it becomes a black hole.", "stop"),
                ("Squeeze the Earth, and it would have to fit inside a radius of about 9 millimetres. The size of a marble.", "reveal"),
                ("But here's what surprises most people. If the Sun became a black hole right now, Earth would not fall in.", "stop"),
                ("Same mass, same pull at our distance. We would keep orbiting. Just in the cold and the dark.", "cold"),
                ("So if black holes don't suck everything in, how do we even find them?", "walk"),
            ], at=dict(maths=1, squeeze=2, sun=3, earth=4, orbit=5, dark=6, find=7),
                facts={"Black hole": ["prevents anything, including light, from escaping",
                                      "In 1916, the first solution of general relativity"],
                       "Karl Schwarzschild": ["while serving in the German army during World War I"],
                       "Schwarzschild radius": ["Sun has a Schwarzschild radius of approximately 3.0 km",
                                                "Earth's is approximately 9 mm"],
                       "Sun": ["1,391,400 km"]},
                derived="Sun radius 3.0 km -> about 6 km across; Earth 9 mm radius ~ a marble. "
                        "Gravity at Earth depends only on the Sun's mass and our distance (Newton), so the orbit is unchanged."),
            dict(comp="BHLFind", name="The invisible monster", lines=[
                ("The first one most scientists accepted was Cygnus X-1, discovered in 1964 on a rocket flight.", "reveal"),
                ("It's about 21 times the mass of the Sun, locked in orbit with a giant blue star.", "walk"),
                ("But the most famous one is much closer to home. At the very centre of our own galaxy.", "walk"),
                ("Sagittarius A star. About 4 million times the mass of the Sun, 26,000 light-years away.", "reveal"),
                ("We can't see it. But we can watch the stars around it.", "stop"),
                ("One star, S2, swings around it every 16 years. At its closest, it reached 7,650 kilometres per second.", "reveal"),
                ("Only something incredibly heavy and incredibly small can do that. That discovery won the 2020 Nobel Prize.", "walk"),
                ("And Sagittarius A star isn't even a big one.", "stop"),
            ], at=dict(companion=1, home=2, sgr=3, stars=4, s2=5, nobel=6, small=7),
                facts={"Cygnus X-1": ["first such source widely accepted to be a black hole", "discovered in 1964 during a rocket flight",
                                      "21.2 times the mass of the Sun", "blue supergiant"],
                       "Sagittarius A*": ["million solar masses", "26,000 light-years", "7,650 km/s", "2020 Nobel Prize in Physics"],
                       "S2 (star)": ["period of 16.0518 years"]}),
            dict(comp="BHLBig", name="How big can they get?", lines=[
                ("Some are far, far bigger. TON 618 holds one of the most massive black holes ever found. About 40 billion times the mass of the Sun.", "reveal"),
                ("Its edge is so wide that light itself would need more than nine days to cross it.", "stop"),
                ("Our whole solar system would be a speck beside it.", "reveal"),
                ("So what happens to a star that almost becomes a black hole, but not quite?", "walk"),
            ], at=dict(cross=1, speck=2, almost=3),
                facts={"TON 618": ["40.7 billion times the Sun's mass"],
                       "Schwarzschild radius": ["Sun has a Schwarzschild radius of approximately 3.0 km"],
                       "Astronomical unit": ["499 light-seconds"]},
                derived="3.0 km x 40.7e9 = 1.22e11 km = 816 au radius, 1,632 au across; x 499 s = 9.4 days for light."),
            dict(comp="BHLNeutron", name="The almost-black-hole", lines=[
                ("When a giant star explodes, its core can collapse into a neutron star.", "reveal"),
                ("More mass than the Sun, packed into a ball about 20 kilometres wide.", "stop"),
                ("One teaspoon of it would weigh more than 900 Great Pyramids.", "reveal"),
                ("But add a little more mass, and not even that can hold. It collapses into a black hole.", "cold"),
            ], at=dict(size=1, spoon=2, collapse=3),
                facts={"Neutron star": ["gravitationally collapsed core of a massive supergiant star", "1.4 solar masses",
                                        "radius on the order of 10 kilometers",
                                        "about 900 times the mass of the Great Pyramid of Giza",
                                        "Tolman–Oppenheimer–Volkoff limit"],
                       "Great Pyramid of Giza": ["6 million tonnes"]}),
            dict(comp="BHLPhoto", name="We took its picture", lines=[
                ("For about a hundred years after the maths predicted them, nobody had ever seen one.", "cold"),
                ("Then, on the 14th of September 2015, detectors on Earth felt a tiny ripple in space itself.", "stop"),
                ("Two black holes, 36 and 29 times the mass of the Sun, had spiralled together and merged.", "reveal"),
                ("The new one weighed 62 Suns. Three whole Suns' worth of mass had turned into that ripple.", "reveal"),
                ("We heard them before we saw them. The picture came four years later.", "walk"),
                ("On the 10th of April 2019, astronomers released the first image of a black hole, in the galaxy M87, 53 million light-years away.", "reveal"),
                ("To see something that small and that far away, you'd need a telescope as big as the Earth. So they linked radio telescopes all around the world, into one.", "walk"),
                ("In 2022, they did it again, for Sagittarius A star.", "reveal"),
                ("So they're real. Now, what happens if you fall in?", "stop"),
            ], at=dict(ripple=1, merge=2, three=3, later=4, image=5, eht=6, sgr=7, fall=8),
                facts={"Black hole": ["In 1916, the first solution of general relativity",
                                      "On 10 April 2019, the first direct image of a black hole"],
                       "GW150914": ["14 September 2015", "first direct observation of gravitational waves",
                                    "merger of two black holes (of 36", "and 29", "of a single, 62"],
                       "Event Horizon Telescope": ["diameter of the entire planet"],
                       "Messier 87": ["53 million light-years"],
                       "Event Horizon Telescope": ["global network of radio telescopes"],
                       "Sagittarius A*": ["May 12, 2022"]}),
            dict(comp="BHLFall", name="The fall", lines=[
                ("Fall feet first into a small black hole, and gravity pulls on your feet far harder than on your head.", "stop"),
                ("You'd be stretched thin, like spaghetti. Scientists really call it spaghettification.", "reveal"),
                ("With a small black hole, that happens before you even reach the edge.", "cold"),
                ("But with a supermassive black hole, you could cross the edge and not notice a thing.", "reveal"),
                ("And this is where the story splits in two.", "stop"),
                ("From your point of view, you simply fall straight through.", "walk"),
                ("But a friend watching from far away would see you slow down, and down, never quite reaching the edge.", "cold"),
                ("Frozen there, slowly fading away.", "cold"),
                ("Both are true. Near a black hole, time itself runs differently.", "reveal"),
                ("And once you're inside, there is no way back out.", "stop"),
                ("Every path leads to the centre, where the maths says you'd be crushed into an infinitely small point. The singularity.", "cold"),
            ], at=dict(spag=1, before=2, giant=3, split=4, you=5, friend=6, frozen=7, both=8, inside=9, centre=10),
                facts={"Spaghettification": ["noodle effect", "extreme tidal forces",
                                             "spaghettification before the event horizon",
                                             "this point lies within the event horizon"],
                       "Black hole": ["produces no locally detectable change",
                                      "never quite reaching the horizon from the perspective of an outside observer",
                                      "traps an object inside", "crushed into an infinitely small point"],
                       "Gravitational time dilation": ["the slower time passes"]}),
            dict(comp="BHLEnd", name="Even black holes die", lines=[
                ("But here's the final twist. Black holes don't last forever.", "stop"),
                ("In 1974, Stephen Hawking showed they should slowly leak radiation, and shrink.", "reveal"),
                ("The smaller they are, the faster they go. If tiny black holes were born at the start of the universe, the smallest would already be gone.", "walk"),
                ("A black hole as heavy as our Sun would take more than ten to the power of sixty-seven years to evaporate.", "stop"),
                ("The universe is only about 14 billion years old.", "reveal"),
                ("So every black hole out there is still waiting, for the universe to grow old.", "cold"),
                ("Subscribe. And next time someone asks what happens in a black hole, tell them there are two answers.", "cta"),
            ], at=dict(hawking=1, small=2, time=3, universe=4, wait=5),
                facts={"Hawking radiation": ["Stephen Hawking in 1974", "takes more than 1067 years to evaporate",
                                             "1.4×1010 years", "shrink and ultimately vanish"],
                       "Black hole": ["would have evaporated by now due to Hawking radiation"]}),
        ],
        description_top=("What really happens if you fall into a black hole? Two completely different things - "
                         "and both are true.\n\nEverything here is drawn in code (no stock footage): the black holes are "
                         "ray-traced, so light really bends around them. The 'photos' are our recreations, not the real images.\n\n"),
        sources="Sources: Wikipedia - Black hole, Schwarzschild radius, Sun, Cygnus X-1, Sagittarius A*, S2 (star), TON 618, "
                "Astronomical unit, Neutron star, Great Pyramid of Giza, Messier 87, Event Horizon Telescope, "
                "Spaghettification, Gravitational time dilation, Hawking radiation, Karl Schwarzschild, GW150914.",
        tags=["black hole", "what happens if you fall into a black hole", "black holes explained", "spaghettification",
              "sagittarius a*", "ton 618", "neutron star", "hawking radiation", "event horizon", "space documentary",
              "astronomy", "science"],
    ),
}


def check_facts(ch):
    for title, texts in ch.get("facts", {}).items():
        page = wiki.page(title)["text"].lower()
        for text in texts:
            if text.lower() not in page:
                raise SystemExit(f"Wikipedia '{title}' no longer says '{text}' - check chapter '{ch['name']}'")


def _secs(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True).stdout.strip()
    return float(out)


def _stamp(t):
    t = int(t)
    return f"{t // 60}:{t % 60:02d}"


def main():
    name = sys.argv[1]
    spec = LONGS[name]
    free, reuse, props_only = "--free" in sys.argv, "--reuse" in sys.argv, "--props" in sys.argv
    # --only 2,5,6  re-make just these chapters (the rest keep their voice and video)
    only = {int(x) for x in sys.argv[sys.argv.index("--only") + 1].split(",")} if "--only" in sys.argv else None
    # --strict-voice  every chapter must come from the first (main) TTS model; no quiet fallback
    # to the second model or edge-tts - the second model reads the same voice ~4 semitones lower
    strict = "--strict-voice" in sys.argv
    base = ROOT / "data" / "jobs" / f"long-{name}"
    base.mkdir(parents=True, exist_ok=True)
    chapter_secs = []
    for i, ch in enumerate(spec["chapters"]):
        job = base / f"ch{i}"
        job.mkdir(exist_ok=True)
        lines = [l for l, _ in ch["lines"]]
        old = job / "props.json"
        if only is not None and i not in only and old.exists():
            chapter_secs.append(json.loads(old.read_text(encoding="utf-8"))["durationInSeconds"])
            continue
        check_facts(ch)
        if reuse and old.exists() and (job / "voice.mp3").exists():
            vo, voice = json.loads(old.read_text(encoding="utf-8"))["vo"], job / "voice.mp3"
            if [v.get("text") for v in vo] != lines:
                raise SystemExit(f"chapter {i}: script changed since its voice was made - build without --reuse")
        elif strict and not free:
            import acted
            acted.TTS_MODELS = acted.TTS_MODELS[:1]
            vo, voice = acted.perform(lines, "explore", job)          # raises rather than falling back
        else:
            vo, voice = narrate.narrate(lines, [k for _, k in ch["lines"]], job, style=None if free else "explore")
        secs = round(vo[-1]["end"] + PAD, 2)
        props = {"vo": vo, "at": ch["at"], "durationInSeconds": secs, "chapter": i, "chapterName": ch["name"]}
        old.write_text(json.dumps(props), encoding="utf-8")
        chapter_secs.append(secs)
        print(f"[ch{i}] {ch['name']}: {secs:.1f}s  starts {[round(v['start'], 1) for v in vo]}")
        if props_only:
            continue
        print(f"[render] ch{i} {ch['comp']}")
        render(ch["comp"], old, job / "silent.mp4")
    total = sum(chapter_secs)
    print(f"[total] {total:.1f}s = {_stamp(total)}")
    if props_only:
        return

    # join: video end to end; each chapter's voice padded to its chapter's length
    vids = base / "concat.txt"
    vids.write_text("".join(f"file '{(base / f'ch{i}' / 'silent.mp4').as_posix()}'\n"
                            for i in range(len(spec["chapters"]))), encoding="utf-8")
    silent = base / "silent.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(vids), "-c", "copy", str(silent)], check=True)
    parts = []
    for i, secs in enumerate(chapter_secs):
        wav = base / f"ch{i}" / "voice_pad.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(base / f"ch{i}" / "voice.mp3"), "-af",
                        f"apad=whole_dur={secs},atrim=0:{secs}", "-ar", "24000", "-ac", "1", str(wav)], check=True)
        parts.append(wav)
    voices = base / "voices.txt"
    voices.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    voice = base / "voice.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(voices), "-c", "copy", str(voice)], check=True)
    bed = base / "score.wav"
    score.build_score(bed, _secs(silent) + 0.5, tone=spec["tone"], seed=spec["seed"])
    out = ROOT / "data" / "out" / f"long-{name}.mp4"
    mix.mix(silent, voice, bed, out, bed_db=-12)

    t, stamps = 0.0, []
    for ch, secs in zip(spec["chapters"], chapter_secs):
        stamps.append(f"{_stamp(t)} {ch['name']}")
        t += secs
    meta = {"kind": "long", "file": str(out), "title": spec["title"],
            "description": spec["description_top"] + "\n".join(stamps) + "\n\n" + spec["sources"]
                           + "\n\n#blackhole #space #science",
            "tags": spec["tags"]}
    (base / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {out}  ({_secs(out):.1f}s)")
    print("\n".join(stamps))


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
