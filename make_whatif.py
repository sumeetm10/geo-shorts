"""What-if Shorts from one builder. Each SPEC holds the script, its beat map, the
hook, the Wikipedia phrases its facts rest on, and the upload text; its animation
is the composition of the same name in remotion/src/shots/geo/.

    python make_whatif.py sunhole --free --props   quick props for stills
    python make_whatif.py sunhole --free           build with the free voice
    python make_whatif.py sunhole                  build (acted voice, edge-tts if it fails)
    python make_whatif.py sunhole --post 2026-10-08T13:15Z   build and schedule it

Every number said or shown is either in a quoted Wikipedia phrase (checked at
build time - the build stops if Wikipedia stops saying it) or plain arithmetic
on those numbers, noted under "derived" in its spec.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import mix  # noqa: E402
import narrate  # noqa: E402
import score  # noqa: E402
import seo  # noqa: E402
import wiki  # noqa: E402
from make_walk import render  # noqa: E402

TAIL = "\n\nWhich what-if should I do next? Tell me in the comments \U0001F447\n\n"

SPECS = {
    # ------------------------------------------------------------------ Sun -> black hole
    "sunhole": dict(
        comp="SunHole", tone="surprising", seed=41,
        lines=[
            ("If the Sun turned into a black hole, Earth would not get sucked in.", "hook"),
            ("From far away, a black hole pulls exactly like anything else with the same mass.", "reveal"),
            ("So Earth keeps circling. Same orbit. Same year.", "walk"),
            ("But the Sun would shrink from 1.4 million km wide...", "stop"),
            ("to just 6 km. You could walk across it in about an hour.", "reveal"),
            ("And you couldn't see it. Not even light escapes.", "cold"),
            ("Fly too close, and gravity stretches you like spaghetti.", "walk"),
            ("Relax. The Sun doesn't have enough mass to ever become one.", "payoff"),
            ("It will end as a white dwarf instead.", "reveal"),
            ("Subscribe, and stay curious.", "cta"),
        ],
        at=dict(same=1, orbit=2, shrink=3, tiny=4, dark=5, spaghetti=6, relax=7, dwarf=8),
        hook={"top": "SUN → BLACK HOLE", "bottom": "WOULD EARTH FALL IN?", "badge": "NO. HERE'S WHY"},
        facts={"Black hole": ["the external gravitational field of a black hole is identical to that of any other body of the same mass",
                              "Nothing, not even light, can escape from inside the event horizon"],
               "Schwarzschild radius": ["the Sun has a Schwarzschild radius of approximately 3.0 km"],
               "Sun": ["its diameter is about 1,391,400 km", "The Sun does not have enough mass",
                       "a dense type of cooling star (a white dwarf)"],
               "Spaghettification": ["stretched like spaghetti"]},
        derived="6 km = twice the 3.0 km radius; at a walking pace of ~5 km/h, 6 km is about an hour (72 min).",
        query="what if the sun became a black hole",
        title="If the Sun Became a Black Hole, Earth Would NOT Fall In \U0001F573️",
        description=("What would really happen if the Sun became a black hole?\n\n"
                     "- From far away, a black hole pulls just like any other object of the same mass - so Earth "
                     "would keep its orbit\n"
                     "- The Sun (1,391,400 km wide) would shrink to about 6 km across - its Schwarzschild radius is ~3 km\n"
                     "- Nothing, not even light, escapes from inside the event horizon\n"
                     "- Get too close and tidal forces stretch you like spaghetti\n"
                     "- The real Sun doesn't have enough mass to become one - it will end as a white dwarf"),
        tags=["what if the sun became a black hole", "sun black hole", "black hole", "spaghettification",
              "white dwarf", "space", "sun", "science", "shorts"],
    ),
    # ------------------------------------------------------------------ a hole through the Earth
    "earthhole": dict(
        comp="EarthHole", tone="curious", seed=52,
        lines=[
            ("Jump into a hole through the Earth, and you'd reach the other side in 38 minutes.", "hook"),
            ("The problem? Our deepest hole ever is just 12 kilometres.", "stop"),
            ("That's 0.2% of the way to the centre.", "reveal"),
            ("Now imagine we keep digging. Past the crust. Into the mantle.", "walk"),
            ("At the core, it's about as hot as the surface of the Sun.", "hot"),
            ("You'd shoot through the centre at top speed.", "walk"),
            ("Then gravity slows you down, until you stop. Right at the other side.", "reveal"),
            ("Miss the edge, and you fall back. Again and again.", "walk"),
            ("But from most land, the other side is ocean. About 85% of it.", "payoff"),
            ("Subscribe before you jump.", "cta"),
        ],
        at=dict(kola=1, tiny=2, dig=3, core=4, center=5, stop=6, back=7, ocean=8),
        hook={"top": "HOLE THROUGH EARTH", "bottom": "HOW LONG TO FALL?", "badge": "38 MINUTES"},
        facts={"Gravity train": ["reduced from 42 to 38 minutes", "The maximum speed is reached at the middle point"],
               "Kola Superdeep Borehole": ["12,262 metres"],
               "Earth": ["about 12,742 km"],
               "Earth's inner core": ["about the temperature at the surface of the Sun"],
               "Antipode (geography)": ["Approximately 15% of land territory is antipodal to other land"]},
        derived="12.262 km of a 6,371 km radius (half of 12,742) = 0.19%; 100% - 15% = 85% of land faces ocean.",
        query="what if you fell through the earth",
        title="Falling Through the Earth Takes Just 38 Minutes \U0001F30D",
        description=("What if you jumped into a hole through the Earth?\n\n"
                     "- With Earth's real density, the fall to the other side takes about 38 minutes\n"
                     "- Our deepest hole, the Kola Superdeep Borehole, reached just 12,262 m - about 0.2% of the way "
                     "to the centre\n"
                     "- The inner core is about as hot as the surface of the Sun\n"
                     "- You'd hit top speed at the centre, then slow to a stop at the other side\n"
                     "- Only about 15% of land has land on the other side - the rest faces ocean"),
        tags=["what if you fell through the earth", "hole through the earth", "gravity train", "earth core",
              "kola superdeep borehole", "antipodes", "geography", "science", "shorts"],
    ),
    # ------------------------------------------------------------------ Earth stops spinning
    "nospin": dict(
        comp="NoSpin", tone="urgent", seed=63,
        lines=[
            ("If Earth suddenly stopped spinning, you wouldn't stop.", "hook"),
            ("At the equator, you'd keep flying east at 1,670 km/h.", "hot"),
            ("That's how fast the ground under you is moving right now.", "reveal"),
            ("The air keeps going too. Winds 4 times faster than the strongest ever recorded.", "walk"),
            ("And the oceans would sweep over the land.", "cold"),
            ("Survive that, and one day lasts a whole year.", "stop"),
            ("Six months of daylight. Then six months of night.", "reveal"),
            ("Even Earth's shape would change. Spinning makes it 43 km wider at the equator.", "walk"),
            ("Good news: it won't happen. Earth is slowing, but by just 2.3 milliseconds a century.", "payoff"),
            ("Subscribe, and hold on tight.", "cta"),
        ],
        at=dict(speed=1, now=2, wind=3, ocean=4, year=5, six=6, bulge=7, slow=8),
        hook={"top": "IF EARTH STOPPED", "bottom": "YOU WOULDN'T", "badge": "1,670 KM/H"},
        facts={"Earth's rotation": ["1,674.7 km/h", "about 2.3 milliseconds per century"],
               "Wind speed": ["408 km/h"],
               "Equatorial bulge": ["about 43 km"]},
        derived=("1,674.7 rounds to 1,670; 1,674.7 / 408 = 4.1x; speed at latitude = 1,674.7 x cos(lat); "
                 "with no spin relative to the stars the Sun crosses the sky once a year (inertia, plain physics)."),
        query="what if the earth stopped spinning",
        title="If Earth Stopped Spinning, You'd Fly Off at 1,670 km/h \U0001F30E",
        description=("What would happen if Earth suddenly stopped spinning?\n\n"
                     "- The equator spins at about 1,674.7 km/h - you'd keep going at that speed\n"
                     "- The air too: about 4x the fastest wind ever recorded (408 km/h, Cyclone Olivia, 1996)\n"
                     "- With no spin, one day would last a whole year: six months of daylight, six of night\n"
                     "- Spin makes Earth about 43 km wider at the equator than pole to pole\n"
                     "- Earth's day is getting longer by only about 2.3 milliseconds per century"),
        tags=["what if the earth stopped spinning", "earth stopped spinning", "earth rotation", "equatorial bulge",
              "earth", "geography", "science", "shorts"],
    ),
    # ------------------------------------------------------------------ the dinosaur asteroid
    "dinorock": dict(
        comp="DinoRock", tone="urgent", seed=74,
        lines=[
            ("The asteroid that killed the dinosaurs was only a little taller than Mount Everest.", "hook"),
            ("About 10 km wide. Everest is 8.8 km tall.", "reveal"),
            ("But it hit at 20 km a second.", "hot"),
            ("Right here, in what is now Mexico.", "walk"),
            ("It punched a hole 100 km wide and 30 km deep.", "reveal"),
            ("Winds near the blast topped 1,000 km/h.", "walk"),
            ("Three quarters of all plant and animal species died out.", "stop"),
            ("And the crater is still there, buried under the Yucatán.", "reveal"),
            ("It was found by geophysicists hunting for oil.", "payoff"),
            ("Subscribe, before the next one.", "cta"),
        ],
        at=dict(size=1, speed=2, mexico=3, hole=4, wind=5, extinct=6, buried=7, oil=8),
        hook={"top": "THE DINOSAUR KILLER", "bottom": "WAS ONLY THIS BIG", "badge": "~10 KM"},
        facts={"Chicxulub crater": ["around 10 kilometers (6 mi) in diameter",
                                    "it would have reached taller than Mount Everest",
                                    "velocity of 20 kilometers per second",
                                    "transient cavity 100 kilometers (60 mi) wide and 30 kilometers (20 mi) deep",
                                    "winds in excess of 1,000 kilometers per hour",
                                    "buried to a depth of about one kilometer",
                                    "who had been looking for petroleum in the Yucat"],
               "Mount Everest": ["8,848.86 m"],
               "Cretaceous–Paleogene extinction event": ["three-quarters (75%) of the plant and animal species"]},
        derived="8,848.86 m = 8.8 km.",
        query="asteroid that killed the dinosaurs",
        title="The Dinosaur-Killing Asteroid Was Only a Little Taller Than Everest ☄️",
        description=("How big was the asteroid that killed the dinosaurs?\n\n"
                     "- About 10 km wide - set at sea level, it would have stood taller than Mount Everest (8,848.86 m)\n"
                     "- It hit at about 20 km per second, in what is now Mexico\n"
                     "- It punched a cavity about 100 km wide and 30 km deep\n"
                     "- Winds near the blast topped 1,000 km/h\n"
                     "- Three-quarters of plant and animal species died out\n"
                     "- The Chicxulub crater is buried about 1 km down under the Yucatan - found by geophysicists "
                     "looking for oil"),
        tags=["asteroid that killed the dinosaurs", "chicxulub", "dinosaur extinction", "asteroid impact",
              "mount everest", "mexico", "geography", "science", "shorts"],
    ),
    # ------------------------------------------------------------------ how big is the Sun
    "sunsize": dict(
        comp="SunSize", tone="curious", seed=85,
        lines=[
            ("The Moon's whole orbit around Earth would fit inside the Sun. Almost twice.", "hook"),
            ("The Sun is 1.39 million km wide. 109 Earths, side by side.", "reveal"),
            ("Fill it up, and about 1.3 million Earths would fit inside.", "walk"),
            ("It holds 99.86% of all the mass in the solar system.", "stop"),
            ("Every planet, moon and asteroid shares the last 0.14%.", "reveal"),
            ("And yet, the Sun is not a big star.", "cold"),
            ("Betelgeuse, in Orion, is over 600 times wider.", "reveal"),
            ("In our Sun's place, it would swallow the orbits of Mercury, Venus, Earth, and Mars.", "payoff"),
            ("Subscribe, and look up tonight.", "cta"),
        ],
        at=dict(wide=1, fill=2, mass=3, rest=4, small=5, betel=6, swallow=7),
        hook={"top": "THE MOON'S ORBIT", "bottom": "FITS INSIDE THE SUN", "badge": "ALMOST TWICE"},
        facts={"Sun": ["its diameter is about 1,391,400 km", "around 109 times that of Earth",
                       "99.86% of the total mass of the Solar System"],
               "Earth": ["orbits Earth at 384,400 km"],
               "Betelgeuse": ["radius between 640 and 764 times that of the Sun",
                              "engulf the orbits of Mercury, Venus, Earth, and Mars", "constellation of Orion"]},
        derived=("Moon's orbit is 2 x 384,400 = 768,800 km across; 1,391,400 / 768,800 = 1.81 (almost twice); "
                 "109^3 = 1.3 million Earths by volume; 100 - 99.86 = 0.14%."),
        query="how big is the sun",
        title="The Moon's Whole Orbit Fits Inside the Sun ☀️",
        description=("How big is the Sun, really?\n\n"
                     "- 1,391,400 km wide - about 109 Earths side by side\n"
                     "- The Moon's orbit (384,400 km out) is 768,800 km across - the Sun is almost twice as wide\n"
                     "- By volume, about 1.3 million Earths would fit inside\n"
                     "- It holds 99.86% of the Solar System's mass\n"
                     "- Betelgeuse, in Orion, has 640-764 times the Sun's radius: in the Sun's place it would "
                     "engulf the orbits of Mercury, Venus, Earth and Mars"),
        tags=["how big is the sun", "size of the sun", "betelgeuse", "sun vs earth", "solar system", "space",
              "sun", "science", "shorts"],
    ),
    # ------------------------------------------------------------------ black holes, series (2026-10-05)
    # Ideas from vidIQ outliers for "black hole" Shorts: "Could you become a black hole?",
    # "Micro black hole passing Earth" (squeeze); "TON 618 - 66 billion suns" (ton618);
    # "NASA simulated falling into a black hole", "You could enter a black hole before
    # feeling the danger" (bhfall).
    "squeeze": dict(
        comp="BHSqueeze", tone="surprising", seed=96,
        lines=[
            ("Crush the whole Earth into a black hole, and it would fit in your hand.", "hook"),
            ("Its edge would be just 18 millimetres across. The size of a marble.", "reveal"),
            ("And the Moon? It would keep circling, as if nothing happened.", "walk"),
            ("Crush the Moon, and you get a black hole the size of a grain of sand.", "reveal"),
            ("Now crush yourself.", "stop"),
            ("You'd be billions of times smaller than a single proton.", "reveal"),
            ("So why isn't everything a black hole?", "question"),
            ("It takes a dying giant star, collapsing under its own weight.", "walk"),
            ("Weirdest part? The biggest black holes are, on average, less dense than our Sun.", "payoff"),
            ("Subscribe for more black holes.", "cta"),
        ],
        at=dict(size=1, moon=2, sand=3, you=4, proton=5, why=6, star=7, density=8),
        hook={"top": "EARTH AS A BLACK HOLE", "bottom": "FITS IN YOUR HAND", "badge": "18 MM WIDE"},
        facts={"Schwarzschild radius": ["Earth's is approximately 9 mm", "the Moon's is approximately 0.1 mm",
                                        "proportional to its mass",
                                        "average density lower than main sequence stars"],
               "Black hole": ["the external gravitational field of a black hole is identical to that of any other body of the same mass",
                              "massive stars collapse at the end of their life cycle"],
               "Proton": ["proton charge radius is around 0.841 fm"],
               "Sand": ["0.0625 mm"]},
        derived=("Earth 2 x 9 mm = 18 mm; Moon 2 x 0.1 mm = 0.2 mm (sand is 0.0625-2 mm); a 70 kg person: "
                 "r = 2GM/c^2 = 1.0e-25 m, vs a proton's 0.841 fm = 8.4e-16 m - about 8 billion times smaller."),
        query="what if earth became a black hole",
        title="If Earth Became a Black Hole, It Would Fit in Your Hand \U0001F573️",
        description=("How small would Earth be as a black hole?\n\n"
                     "- Earth's Schwarzschild radius is about 9 mm - a black hole 18 mm across, the size of a marble\n"
                     "- Same mass, same pull from afar: the Moon would keep its orbit\n"
                     "- The Moon's is about 0.1 mm - a black hole the size of a grain of sand\n"
                     "- A person's would be billions of times smaller than a proton (0.841 fm)\n"
                     "- Real black holes form when massive stars collapse at the end of their lives\n"
                     "- The most massive black holes are, on average, less dense than stars like the Sun"),
        tags=["what if earth became a black hole", "earth black hole", "schwarzschild radius", "black hole",
              "could you become a black hole", "space", "physics", "science", "shorts"],
    ),
    "ton618": dict(
        comp="TonBH", tone="surprising", seed=107,
        lines=[
            ("Our whole solar system would be a speck next to this black hole.", "hook"),
            ("It's called TON 618, and it weighs as much as 40 to 66 billion Suns.", "reveal"),
            ("Let's size it up. Here's our Sun.", "walk"),
            ("Our own galaxy's black hole is about 18 times wider.", "reveal"),
            ("Now zoom out to the whole solar system, all the way to Neptune.", "walk"),
            ("TON 618's edge is so big, Neptune's orbit fits across it more than 25 times.", "stop"),
            ("Light itself would need over 9 days to cross it.", "reveal"),
            ("And the light we see from it left 10.8 billion years ago...", "cold"),
            ("long before Earth even existed.", "payoff"),
            ("Subscribe for more black holes.", "cta"),
        ],
        at=dict(name=1, sun=2, sgr=3, solar=4, edge=5, light=6, past=7, before=8),
        hook={"top": "TON 618", "bottom": "THE MONSTER BLACK HOLE", "badge": "40-66 BILLION SUNS"},
        facts={"TON 618": ["roughly 40.7 billion times the Sun's mass", "66 billion",
                           "approximately 10.8 billion years"],
               "Schwarzschild radius": ["the Sun has a Schwarzschild radius of approximately 3.0 km",
                                        "proportional to its mass"],
               "Sagittarius A*": ["4.297±0.012 million solar masses"],
               "Sun": ["its diameter is about 1,391,400 km", "8 minutes and 20 seconds"],
               "Neptune": ["30.1 astronomical units (4.5 billion kilometres"],
               "Earth": ["formed about 4.5 billion years ago"]},
        derived=("Schwarzschild radius scales with mass from the Sun's 3.0 km: Sgr A* 12.9 million km (25.8 million "
                 "across = 18.5 Suns); TON 618 at 40.7 billion = 1.22e11 km = 816 AU (1 AU = 4.5e9/30.1 km), "
                 "1,632 AU across vs Neptune's orbit 60.2 AU = 27x (43x at 66 billion); light crosses 1 AU in "
                 "8 min 20 s, so 1,632 AU = 9.4 days."),
        query="ton 618 black hole",
        title="TON 618: Our Whole Solar System Is a Speck Next to It \U0001F573️",
        description=("How big is TON 618, one of the biggest black holes ever found?\n\n"
                     "- About 40.7 billion times the Sun's mass (older estimates: 66 billion)\n"
                     "- Our galaxy's black hole, Sagittarius A* (4.3 million Suns), has an event horizon ~18 times "
                     "wider than the Sun\n"
                     "- TON 618's is so big that Neptune's orbit fits across it more than 25 times\n"
                     "- Light would take over 9 days to cross it\n"
                     "- Its light set off about 10.8 billion years ago - Earth formed 4.5 billion years ago"),
        tags=["ton 618", "biggest black hole", "ton 618 black hole", "largest black hole", "black hole size",
              "sagittarius a*", "space", "science", "shorts"],
    ),
    "bhfall": dict(
        comp="BHFall", tone="surprising", seed=118,
        lines=[
            ("The bigger the black hole, the safer it is to fall in.", "hook"),
            ("A small one pulls your feet so much harder than your head...", "reveal"),
            ("you'd be stretched like spaghetti before you even reach the edge.", "walk"),
            ("But a giant one, like the monster at our galaxy's centre,", "walk"),
            ("you could cross its edge without noticing a thing.", "reveal"),
            ("Then it gets strange. To a friend watching from far away,", "stop"),
            ("you'd slow down, turn red, and seem to freeze at the edge.", "cold"),
            ("For you, there's no going back. Every path leads to the centre.", "payoff"),
            ("Not even light gets out.", "reveal"),
            ("Subscribe for more black holes.", "cta"),
        ],
        at=dict(small=1, spag=2, giant=3, cross=4, friend=5, freeze=6, inside=7, light=8),
        hook={"top": "FALL INTO A BLACK HOLE", "bottom": "BIGGER IS SAFER?!", "badge": "IT'S TRUE"},
        facts={"Spaghettification": ["an astronaut may cross the event horizon without noticing any significant tidal forces",
                                     "falling toward the center becomes inevitable",
                                     "tidal forces would cause the astronaut to undergo spaghettification before the event horizon",
                                     "such as those found at a galaxy's center", "stretched like spaghetti"],
               "Event horizon": ["appears to slow down, never quite crossing the horizon", "its image reddens over time"],
               "Black hole": ["Nothing, not even light, can escape from inside the event horizon"]},
        derived="Tidal stretch = the difference in pull between feet and head (plain physics).",
        query="what happens if you fall into a black hole",
        title="The Bigger the Black Hole, the Safer It Is to Fall In \U0001F573️",
        description=("What happens if you fall into a black hole?\n\n"
                     "- Near a small (stellar) black hole, tidal forces spaghettify you before the event horizon\n"
                     "- At a supermassive one, like those at galaxy centres, you could cross the horizon without "
                     "noticing any significant tidal forces\n"
                     "- A distant friend would see you slow down, redden and never quite cross\n"
                     "- Inside the horizon, falling toward the centre is inevitable - nothing, not even light, escapes"),
        tags=["what happens if you fall into a black hole", "falling into a black hole", "spaghettification",
              "event horizon", "black hole", "space", "physics", "science", "shorts"],
    ),
    # ------------------------------------------------------------------ river journeys (2026-10-05)
    # User's idea: "what is the longest river in Asia and how long would you have to swim to
    # reach the ocean". RiverSwim.tsx draws any river from rivers.py (Natural Earth lines).
    "yangtze": dict(
        comp="RiverSwim", tone="curious", seed=129,
        lines=[
            ("Could you swim Asia's longest river, all the way to the sea?", "hook"),
            ("The Yangtze flows 6,236 km, from the Tibetan Plateau to the East China Sea.", "reveal"),
            ("It's the third-longest river on Earth.", "walk"),
            ("On the way, you'd hit the Three Gorges Dam. The biggest hydropower station in the world.", "stop"),
            ("One man actually did it. In 2004, Martin Strel swam 4,003 km of the Yangtze.", "reveal"),
            ("It took him 40 days. About 100 km, every single day.", "walk"),
            ("At that pace, the whole river would take about 62 days.", "reveal"),
            ("And he finished in Shanghai, by the sea.", "payoff"),
            ("Subscribe for more journeys like this.", "cta"),
        ],
        at=dict(length=1, third=2, dam=3, strel=4, days=5, whole=6, finish=7),
        hook={"top": "SWIM THE YANGTZE?", "bottom": "ASIA'S LONGEST RIVER", "badge": "6,236 KM"},
        facts={"Yangtze": ["flows for 6,236 kilometers", "third-longest river in the world", "Tibetan Plateau",
                           "East China Sea", "largest hydro-electric power station in the world"],
               "Martin Strel": ["Yangtze River (4,003 km", "the longest river in Asia", "He reached Shanghai in 40 days"]},
        derived="4,003 km / 40 days = 100 km a day; 6,236 km / 100 km a day = 62 days.",
        extra=lambda: {"river": {
            "name": "YANGTZE", "length": 6236, "swum": 4003,
            "line": __import__("rivers").river("Yangtze", (121.9, 31.4)),
            "source": "TIBETAN PLATEAU", "mouth": "EAST CHINA SEA",
            "dam": {"name": "THREE GORGES DAM", "lon": 111.0, "lat": 30.82},
            "finish": {"name": "SHANGHAI", "lon": 121.47, "lat": 31.23},
            "view": {"lon": 109.5, "lat": 30.5}}},
        query="swimming the yangtze river",
        title="Could You Swim Asia's Longest River to the Sea? 🌊",
        description=("Could you swim the Yangtze all the way to the sea?\n\n"
                     "- The Yangtze flows 6,236 km from the Tibetan Plateau to the East China Sea - the "
                     "third-longest river in the world and the longest in Asia\n"
                     "- The Three Gorges Dam on it is the world's largest hydro-electric power station\n"
                     "- In 2004 Martin Strel swam 4,003 km of it in 40 days (about 100 km a day), finishing in "
                     "Shanghai\n"
                     "- At that pace the whole river would take about 62 days"),
        tags=["yangtze river", "longest river in asia", "swimming the yangtze", "martin strel",
              "three gorges dam", "china", "geography", "rivers", "shorts"],
    ),
    # ------------------------------------------------------------------ "facts that sound fake" (2026-10-05)
    # vidIQ: "Country with 3 capitals" 56x, "5 Africa facts that sound fake", "Geography facts that
    # make no sense" - one surprising-but-true claim per beat, shown on the globe.
    "antarctica": dict(
        comp="Antarctica", tone="curious", seed=140,
        lines=[
            ("These Antarctica facts sound fake. They're all true.", "hook"),
            ("It's a desert. The driest continent on Earth.", "reveal"),
            ("Yet about 70% of all the fresh water on the planet is frozen there.", "walk"),
            ("The ice is 1.9 km thick, on average.", "stop"),
            ("Melt it, and the seas would rise almost 60 metres.", "cold"),
            ("It hit minus 89.2 degrees, the coldest temperature ever measured on Earth.", "cold"),
            ("It's about 40% bigger than Europe.", "reveal"),
            ("No army is allowed. A treaty signed by 29 countries bans military activity and mining.", "walk"),
            ("And the first baby born on the mainland arrived in 1978.", "payoff"),
            ("Subscribe for more facts that sound fake.", "cta"),
        ],
        at=dict(desert=1, water=2, ice=3, sea=4, cold=5, size=6, treaty=7, baby=8),
        hook={"top": "ANTARCTICA FACTS", "bottom": "THAT SOUND FAKE", "badge": "ALL TRUE"},
        facts={"Antarctica": ["driest", "polar desert", "About 70% of the world's freshwater reserves are frozen in Antarctica",
                              "average thickness of 1.9 km", "raise global sea levels by almost 60 metres",
                              "lowest measured temperature on Earth, −89.2 °C", "about 40% larger than Europe",
                              "governed by 29 countries", "military activity, mining", "on 7 January 1978"]},
        derived="",
        query="antarctica facts",
        title="Antarctica Facts That Sound Fake (But Are True) \U0001F9CA",
        description=("Antarctica facts that sound fake - but are true:\n\n"
                     "- It's a polar desert, the driest continent\n"
                     "- About 70% of the world's freshwater reserves are frozen there\n"
                     "- Its ice sheet averages 1.9 km thick\n"
                     "- If it melted, global sea levels would rise by almost 60 m\n"
                     "- Lowest temperature ever measured on Earth: -89.2 °C\n"
                     "- It's about 40% larger than Europe\n"
                     "- It's governed by 29 countries under the Antarctic Treaty, which bans military activity and mining\n"
                     "- The first person born on the mainland arrived on 7 January 1978"),
        tags=["antarctica facts", "antarctica", "facts that sound fake", "geography facts", "south pole",
              "continents", "geography", "shorts"],
    ),
    # ------------------------------------------------------------------ quality-first space (2026-10-09)
    # Rules: <=30 s, motion + question in the first second, TWO sources per fact.
    # vidIQ: "Flying to Andromeda's Black Hole" 652k. Second source for the twist: the 2025
    # Sawala et al. study (Univ. Helsinki; Hubble + Gaia; 100,000 simulations) as reported by
    # UWA, Live Science and EarthSky - ~50% chance of no merger in 10 bn years.
    "andromeda": dict(
        comp="AndroCollide", tone="surprising", seed=151,
        lines=[
            ("A whole galaxy is coming straight for us. You can see it tonight.", "hook"),
            ("Andromeda. 2.5 million light-years away, closing in at 300 km a second.", "reveal"),
            ("For years, we thought it would hit us in about 4.5 billion years.", "walk"),
            ("Then 100,000 computer simulations said: maybe not.", "stop"),
            ("Now it's roughly a coin flip.", "reveal"),
            ("And even if they crash, the stars almost never hit each other.", "walk"),
            ("They're as far apart as ping-pong balls, kilometres from each other.", "payoff"),
            ("Subscribe for more space.", "cta"),
        ],
        at=dict(name=1, then=2, sims=3, coin=4, stars=5, pong=6),
        hook={"top": "A GALAXY IS COMING", "bottom": "FOR US", "badge": "SEE IT TONIGHT"},
        facts={"Andromeda Galaxy": ["2.5 million light-years", "visible to the naked eye", "300 km/s",
                                    "50% chance of colliding with each other in the next 10 billion years"],
               "Andromeda–Milky Way collision": ["may occur in about 4.5 billion years",
                                                  "one ping-pong ball every 3.2 km",
                                                  "extremely unlikely that any two stars from the merging galaxies would collide"]},
        derived="100,000 simulations: Sawala et al. 2025 (UWA / Live Science / EarthSky), checked by hand.",
        query="andromeda galaxy collision",
        title="A Galaxy Is Coming for Us - But It Might Miss \U0001F30C",
        description=("Is Andromeda really going to crash into the Milky Way?\n\n"
                     "- Andromeda is 2.5 million light-years away and visible to the naked eye on dark nights\n"
                     "- It is approaching at about 300 km/s\n"
                     "- The old forecast: a collision in about 4.5 billion years\n"
                     "- A 2025 study ran 100,000 simulations with Hubble and Gaia data: about a 50% chance there is "
                     "NO merger in the next 10 billion years\n"
                     "- Even if they merge, stars almost never collide - like one ping-pong ball every 3.2 km"),
        tags=["andromeda galaxy", "andromeda collision", "milky way andromeda", "andromeda milky way collision",
              "galaxy collision", "space", "astronomy", "science", "shorts"],
    ),
    # ------------------------------------------------------------------ batch 2026-10-09 (quality rules)
    "voyager": dict(
        comp="VoyagerDay", tone="curious", seed=162,
        lines=[
            ("Next month, a spacecraft from 1977 will be one full light-day from Earth.", "hook"),
            ("Voyager 1. Launched in 1977, and still sending messages home.", "reveal"),
            ("Right now it's 25.6 billion km away.", "walk"),
            ("So far that its signals take over 23 hours to reach us.", "stop"),
            ("On November 18th, that becomes a full 24 hours.", "reveal"),
            ("No human-made object has ever been this far.", "cold"),
            ("And it's still flying at 17 km every second.", "payoff"),
            ("Subscribe for more space.", "cta"),
        ],
        at=dict(name=1, far=2, signal=3, day=4, record=5, speed=6),
        hook={"top": "1 LIGHT-DAY", "bottom": "FROM EARTH", "badge": "NOV 18, 2026"},
        facts={"Voyager 1": ["September 5, 1977", "25.6 billion km", "took more than 23 hours to reach Earth",
                             "one light day from Earth in November 2026", "most distant human-made object",
                             "17 km/s"]},
        derived="Nov 18 2026 is NASA's official date (EarthSky, IFLScience; checked by hand).",
        query="voyager 1",
        title="Voyager 1 Is About to Be One Light-Day From Earth \U0001F6F0️",
        description=("A spacecraft from 1977 is about to pass a milestone no human-made object ever has.\n\n"
                     "- Voyager 1 launched on September 5, 1977, and still talks to Earth\n"
                     "- It is about 25.6 billion km away (August 2026)\n"
                     "- Its signals already take more than 23 hours to reach us\n"
                     "- On November 18, 2026 (NASA's date) it reaches one light-day: 24 hours\n"
                     "- It is the most distant human-made object, flying at about 17 km/s"),
        tags=["voyager 1", "voyager 1 light day", "voyager 1 2026", "most distant spacecraft", "nasa voyager",
              "space", "astronomy", "science", "shorts"],
    ),
    "amazon": dict(
        comp="RiverStory", tone="curious", seed=173,
        lines=[
            ("Could you swim the Amazon, all the way to the sea?", "hook"),
            ("It carries more water than any other river on Earth.", "reveal"),
            ("And there isn't a single bridge across it.", "stop"),
            ("In 2007, one man swam it anyway. 5,268 km.", "reveal"),
            ("His team carried blood, to distract the piranhas.", "cold"),
            ("He swam for over two months, from Peru to Brazil.", "walk"),
            ("That's almost 80 km, every single day.", "payoff"),
            ("Subscribe for more journeys like this.", "cta"),
        ],
        at=dict(water=1, bridge=2, swim=3, piranha=4, months=5, perday=6),
        hook={"top": "SWIM THE AMAZON?", "bottom": "ALL THE WAY TO THE SEA", "badge": "ONE MAN DID"},
        facts={"Amazon River": ["the largest river in the world by discharge volume of water",
                                "There are no bridges across the entire width of the river"],
               "Martin Strel": ["5,268 km", "pour blood into the river to distract"]},
        derived="Guinness: 5,268 km, Atalaya (Peru) to Belem (Brazil), 1 Feb - 8 Apr 2007 (67 days; press says 66) -> 'over two months'; 5,268/67 = 79 km a day.",
        extra=lambda: {"river": {
            "name": "AMAZON", "line": __import__("rivers").river(["Ucayali", "Amazonas"], (-50.0, -0.2)),
            "start": {"name": "ATALAYA, PERU", "lon": -73.77, "lat": -10.73},
            "finish": {"name": "BELÉM, BRAZIL", "lon": -48.5, "lat": -1.45},
            "swimmer": "MARTIN STREL", "year": 2007, "km": 5268, "days": 67,
            "view": {"lon": -62.0, "lat": -6.5}}},
        query="swimming the amazon river",
        title="One Man Swam the Entire Amazon River \U0001F30A",
        description=("Could you swim the Amazon all the way to the sea? One man did.\n\n"
                     "- The Amazon carries more water than any other river on Earth\n"
                     "- There are no bridges across its entire width\n"
                     "- In 2007 Martin Strel swam 5,268 km of it, from Atalaya, Peru to Belem, Brazil "
                     "(Guinness World Records)\n"
                     "- His team carried blood to distract piranhas\n"
                     "- Over two months in the water - almost 80 km a day"),
        tags=["amazon river", "swimming the amazon", "martin strel", "amazon river facts", "piranhas",
              "longest swim", "geography", "rivers", "shorts"],
    ),
    "nepal": dict(
        comp="NepalFacts", tone="curious", seed=184,
        lines=[
            ("Nepal's flag breaks a rule every other country follows.", "hook"),
            ("It's the only national flag in the world that isn't a rectangle.", "reveal"),
            ("And the only one that's taller than it is wide.", "walk"),
            ("But that's not the strangest thing about Nepal.", "stop"),
            ("Eight of the world's ten highest mountains are here.", "reveal"),
            ("It was never colonised.", "walk"),
            ("And its clock is set 5 hours 45 minutes ahead. Only three time zones do that.", "payoff"),
            ("Subscribe for more facts that sound fake.", "cta"),
        ],
        at=dict(rect=1, tall=2, strange=3, peaks=4, never=5, clock=6),
        hook={"top": "NEPAL'S FLAG", "bottom": "BREAKS THE RULE", "badge": "THE ONLY ONE"},
        facts={"Flag of Nepal": ["only non-rectangular/square national flag in the world",
                                 "the only one that is taller than it is wide", "double-pennon"],
               "Nepal": ["eight of the world's ten highest mountains", "never colonised"],
               "Nepal Standard Time": ["UTC+05:45", "one of only three time zones with a 45-minute offset"]},
        derived="",
        query="nepal flag",
        title="The Only Country Whose Flag Isn't a Rectangle \U0001F1F3\U0001F1F5",
        description=("Nepal facts that sound fake - but are true:\n\n"
                     "- Nepal's is the only national flag that isn't a rectangle or square\n"
                     "- It's the only one taller than it is wide (a double pennon)\n"
                     "- Eight of the world's ten highest mountains are in Nepal\n"
                     "- Nepal was never colonised\n"
                     "- Nepal Standard Time is UTC+05:45 - one of only three time zones with a 45-minute offset"),
        tags=["nepal flag", "nepal facts", "only non rectangular flag", "nepal", "flags",
              "facts that sound fake", "geography", "shorts"],
    ),
    # ------------------------------------------------------------------ "like Voyager" (2026-10-10)
    "apophis": dict(
        comp="ApophisPass", tone="surprising", seed=195,
        lines=[
            ("On Friday the 13th, 2029, an asteroid flies closer than our satellites.", "hook"),
            ("It's called Apophis, after a serpent of darkness.", "reveal"),
            ("When it was found, it had a 2.7% chance of hitting us.", "stop"),
            ("Then that was ruled out.", "walk"),
            ("But it will still pass just 31,600 km up.", "reveal"),
            ("Closer than the satellites at 35,786 km.", "walk"),
            ("And you'll see it with your naked eye.", "payoff"),
            ("Subscribe, and mark your calendar.", "cta"),
        ],
        at=dict(name=1, odds=2, ruled=3, close=4, sats=5, eyes=6),
        hook={"top": "FRIDAY THE 13TH", "bottom": "APRIL 2029", "badge": "CLOSER THAN SATELLITES"},
        facts={"99942 Apophis": ["Friday, April 13, 2029", "probability of 2.7%", "eliminated that possibility",
                                 "31,600 km", "visible to the naked eye", "Apep", "serpent"],
               "Geostationary orbit": ["35,786 km"]},
        derived="",
        query="apophis asteroid 2029",
        title="An Asteroid Will Fly Closer Than Our Satellites in 2029 ☄️",
        description=("Apophis will pass Earth on Friday, April 13, 2029.\n\n"
                     "- Named after Apep, the Egyptian serpent of darkness\n"
                     "- In 2004 it briefly had a 2.7% chance of hitting Earth in 2029 - later ruled out\n"
                     "- It will pass about 31,600 km above the surface - closer than satellites in geostationary "
                     "orbit (35,786 km)\n"
                     "- It should be visible to the naked eye from dark places"),
        tags=["apophis", "apophis 2029", "asteroid 2029", "apophis asteroid", "asteroid close approach",
              "space", "astronomy", "science", "shorts"],
    ),
    "parker": dict(
        comp="ParkerSun", tone="surprising", seed=206,
        lines=[
            ("The fastest thing humans ever built is flying into the Sun.", "hook"),
            ("Parker Solar Probe. 690,000 km an hour.", "reveal"),
            ("Fast enough to cross Earth in about a minute.", "walk"),
            ("On Christmas Eve 2024, it passed just 6.16 million km from the Sun.", "stop"),
            ("Nothing we've made has ever been closer.", "reveal"),
            ("Outside, its heat shield faces 1,370 degrees.", "hot"),
            ("Behind it, the instruments sit at just 29.", "payoff"),
            ("Subscribe for more space.", "cta"),
        ],
        at=dict(name=1, cross=2, xmas=3, record=4, heat=5, cool=6),
        hook={"top": "FLYING INTO", "bottom": "THE SUN", "badge": "690,000 KM/H"},
        facts={"Parker Solar Probe": ["690,000 km/h", "fastest object ever built", "December 24, 2024",
                                      "6.16 million km", "closest ever artificial object to the Sun", "1,370 °C", "29 °C"],
               "Earth": ["about 12,742 km"]},
        derived="12,742 km / 690,000 km/h = 66 s, 'about a minute'.",
        query="parker solar probe",
        title="The Fastest Thing Ever Built Is Flying Into the Sun ☀️",
        description=("Parker Solar Probe - the fastest object humans have ever built.\n\n"
                     "- 690,000 km/h at its closest approach - fast enough to cross Earth in about a minute\n"
                     "- On December 24, 2024 it passed 6.16 million km from the Sun\n"
                     "- It has been the closest human-made object to the Sun since 2018\n"
                     "- Its heat shield faces about 1,370 °C; behind it the instruments stay at about 29 °C"),
        tags=["parker solar probe", "fastest object ever built", "touching the sun", "nasa sun mission", "sun",
              "space", "astronomy", "science", "shorts"],
    ),
    "issdeorbit": dict(
        comp="IssCrash", tone="urgent", seed=217,
        lines=[
            ("NASA is going to crash the space station into the ocean. On purpose.", "hook"),
            ("It's the largest spacecraft ever built.", "reveal"),
            ("Racing around Earth at 28,000 km an hour. 16 sunrises a day.", "walk"),
            ("After 2030, a special vehicle will push it down.", "stop"),
            ("Point Nemo. The place farthest from any land.", "reveal"),
            ("A spacecraft cemetery, where hundreds of old satellites lie.", "cold"),
            ("And the closest humans? Often astronauts on the ISS.", "payoff"),
            ("But why crash it at all? Subscribe for part 2.", "cta"),
        ],
        at=dict(big=1, fast=2, down=3, push=3, nemo=4, grave=5, twist=6),
        hook={"top": "NASA WILL CRASH", "bottom": "THE SPACE STATION", "badge": "ON PURPOSE"},
        facts={"International Space Station": ["largest human spacecraft ever constructed", "28,000 kilometres per hour",
                                               "16 sunrises and sunsets daily"],
               "Deorbit of the International Space Station": ["operational until the end of 2030", "U.S. Deorbit Vehicle",
                                                              "spacecraft cemetery"],
               "Point Nemo": ["oceanic pole of inaccessibility", "hundreds of decommissioned satellites",
                              "the closest human beings are astronauts aboard the International Space Station"]},
        derived="",
        query="iss deorbit",
        title="NASA Will Crash the Space Station Into the Ocean - On Purpose \U0001F6F0️",
        description=("What happens to the International Space Station at the end?\n\n"
                     "- It's the largest human spacecraft ever built, circling at 28,000 km/h (16 sunrises a day)\n"
                     "- It's expected to operate until the end of 2030; then the U.S. Deorbit Vehicle will steer it down\n"
                     "- Remnants are aimed at the 'spacecraft cemetery' near Point Nemo, the place farthest from land\n"
                     "- Near Point Nemo, the closest humans are sometimes the astronauts on the ISS overhead"),
        tags=["iss deorbit", "international space station", "point nemo", "spacecraft cemetery", "nasa iss",
              "space", "astronomy", "science", "shorts"],
    ),
    "sgra": dict(
        comp="GalaxyHeart", tone="surprising", seed=244,
        lines=[
            ("At the centre of our galaxy hides a black hole 4 million times heavier than the Sun.", "hook"),
            ("Sagittarius A star. 26,000 light-years away.", "reveal"),
            ("Nobody can see it. So how do we know it's there?", "stop"),
            ("Stars. One, called S2, whips around it every 16 years.", "walk"),
            ("At its closest, it hit 7,650 km a second. Almost 3% of the speed of light.", "reveal"),
            ("That discovery won the 2020 Nobel Prize.", "walk"),
            ("And in 2022, we finally took its picture.", "payoff"),
            ("Subscribe for more black holes.", "cta"),
        ],
        at=dict(name=1, see=2, s2=3, speed=4, nobel=5, photo=6),
        hook={"top": "THE MONSTER AT", "bottom": "OUR GALAXY'S HEART", "badge": "4 MILLION SUNS"},
        facts={"Sagittarius A*": ["million solar masses", "26,000 light-years", "2020 Nobel Prize in Physics",
                                  "May 12, 2022", "first image of Sagittarius A*", "7,650 km/s", "the star S2"],
               "S2 (star)": ["period of 16.0518 years", "7,650 km/s", "almost 3% of the speed of light"]},
        derived="4.297 million solar masses, said as 4 million; 16.05 years said as 16.",
        query="sagittarius a*",
        title="The Black Hole at the Centre of Our Galaxy 🕳️",
        description=("Sagittarius A* - the supermassive black hole at the heart of the Milky Way.\n\n"
                     "- About 4.3 million times the mass of the Sun, roughly 26,000 light-years away\n"
                     "- We can't see it directly - we know it's there from the stars orbiting it\n"
                     "- The star S2 circles it every 16 years and reached 7,650 km/s (almost 3% of light speed) in 2018\n"
                     "- The discovery earned Reinhard Genzel and Andrea Ghez the 2020 Nobel Prize in Physics\n"
                     "- On May 12, 2022, the Event Horizon Telescope released the first image of it\n\n"
                     "The black hole in this video is ray-traced in code: light is bent by gravity, so you see the far "
                     "side of the disk over the top. The 'photo' is our recreation, not the real image."),
        tags=["sagittarius a*", "black hole", "milky way black hole", "supermassive black hole", "s2 star",
              "event horizon telescope", "space", "astronomy", "shorts"],
    ),
    "isspart2": dict(
        comp="IssWhy", tone="urgent", seed=231,
        lines=[
            ("Why not just leave the space station up there?", "hook"),
            ("Because it's old. Air leaks. Even mold.", "reveal"),
            ("Astronauts spend half their time just fixing it.", "stop"),
            ("And left alone, it would fall anyway. Like Skylab in 1979.", "walk"),
            ("Skylab rained debris on Australia. A town fined NASA 400 dollars for littering.", "reveal"),
            ("So SpaceX is building a tug with 46 thrusters to steer it down.", "walk"),
            ("But some lawmakers now want NASA to study saving it instead.", "payoff"),
            ("Crash it or save it? Tell me below.", "cta"),
        ],
        at=dict(old=1, half=2, fall=3, sky=4, tug=5, save=6),
        hook={"top": "WHY CRASH", "bottom": "THE SPACE STATION?", "badge": "PART 2"},
        facts={"International Space Station": ["air leaks", "mold", "half of their time on station maintenance",
                                               "unacceptable risk", "46 Draco thrusters", "selected SpaceX",
                                               "safe orbital harbor"],
               "Skylab": ["July 11, 1979", "Western Australia", "fined NASA A$400 for littering"]},
        derived="",
        query="why is nasa crashing the iss",
        title="Why NASA Is Crashing the Space Station Into the Ocean (Part 2) 🛰️",
        description=("Why not just leave the ISS in orbit? Part 1: https://youtu.be/CK05yF0GTz0\n\n"
                     "- The station is ageing: air leaks and mold, and astronauts spend about half their time on maintenance\n"
                     "- Left alone it would fall anyway - NASA judged a random reentry an unacceptable risk\n"
                     "- Skylab fell on July 11, 1979, scattering debris across Western Australia; the Shire of Esperance "
                     "fined NASA A$400 for littering\n"
                     "- SpaceX is building the U.S. Deorbit Vehicle: a Dragon with 46 Draco thrusters\n"
                     "- In 2026, US lawmakers asked NASA to study moving the ISS to a safe orbital harbor instead"),
        tags=["why is nasa crashing the iss", "iss deorbit", "international space station", "skylab",
              "space station crash", "nasa", "space", "science", "shorts"],
    ),
}


def check_facts(spec):
    for title, texts in spec["facts"].items():
        page = wiki.page(title)["text"].lower()
        for text in texts:
            if text.lower() not in page:
                raise SystemExit(f"Wikipedia '{title}' no longer says '{text}' - check the script")


def main():
    name = sys.argv[1]
    spec = SPECS[name]
    check_facts(spec)
    lines = spec["lines"]
    job = ROOT / "data" / "jobs" / name
    job.mkdir(parents=True, exist_ok=True)
    free = "--free" in sys.argv
    old = job / "props.json"
    if "--reuse" in sys.argv and old.exists() and (job / "voice.mp3").exists():
        # re-render with the voice already made for this script (after visual fixes)
        vo, voice = json.loads(old.read_text(encoding="utf-8"))["vo"], job / "voice.mp3"
        if [v.get("text") for v in vo] != [l for l, _ in lines]:
            raise SystemExit("the script changed since the voice was made - build without --reuse")
    else:
        vo, voice = narrate.narrate([l for l, _ in lines], [k for _, k in lines], job,
                                    style=None if free else "explore")
    secs = round(vo[-1]["end"] + 0.45, 2)
    props = {"vo": vo, "hook": spec["hook"], "at": spec["at"], "durationInSeconds": secs}
    if "extra" in spec:                          # data the animation needs (e.g. a river's line)
        props.update(spec["extra"]())
    (job / "props.json").write_text(json.dumps(props), encoding="utf-8")
    if "--props" in sys.argv:
        print([round(v["start"], 1) for v in vo], secs)
        return
    print(f"[render] {spec['comp']} {secs:.1f}s")
    subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True, capture_output=True)
    silent = job / "silent.mp4"
    render(spec["comp"], job / "props.json", silent)
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone=spec["tone"], seed=spec["seed"])
    out = ROOT / "data" / "out" / f"{name}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    mix.mix(silent, voice, bed, out, bed_db=-9)
    found = [q for q in seo.suggestions(spec["query"]) if len(q) < 60][:6]
    meta = {"kind": "whatif", "file": str(out), "title": spec["title"],
            "description": spec["description"] + TAIL + "#space #earth #science #shorts",
            "tags": list(dict.fromkeys([spec["tags"][0], *found, *spec["tags"][1:]])),
            "lines": [l for l, _ in lines]}
    (job / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {out}  ({mix.duration(out):.1f}s)")
    if "--post" in sys.argv:
        import upload_geo
        at = datetime.strptime(sys.argv[sys.argv.index("--post") + 1], "%Y-%m-%dT%H:%MZ").replace(tzinfo=timezone.utc)
        vid = upload_geo.upload(out, meta, "public", publish_at=at)
        print(f"[posted] https://youtu.be/{vid} scheduled {at:%Y-%m-%d %H:%M} UTC")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
