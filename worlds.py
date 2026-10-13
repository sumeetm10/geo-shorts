"""Atlas on other worlds - topics for the morning slot (from 2026-10-14).

Every number comes from the world's Wikipedia article (checked at build time by
make_world.py) and everything else is plain arithmetic:
    around the middle = pi x diameter        (a sphere's circumference)
    days on foot      = km / 5.0 km/h / 8 h  (Wikipedia "Preferred walking speed")
    weight on a scale = 70 kg x gravity ratio
The scripts are templates, not model-written: the explore format's model-written
scripts failed the fact gate night after night.
"""

WORLDS = [
    dict(id="mars-around", type="around", world="Mars", look="mars", diameter=6779, gravity="38% of Earth's",
         land="A red desert of dust and rock, coloured by iron oxide.",
         gravity_line="Gravity here is only 38% of Earth's, so every step feels light.",
         extra_line="On the way, there's Olympus Mons, a volcano 21.9 km tall.",
         extra_label="OLYMPUS MONS · 21.9 KM TALL",
         facts={"Mars": ["6,779 km", "38% of Earth's surface gravity", "Olympus Mons, 21.9 km",
                         "reddish iron oxides"],
                "Preferred walking speed": ["5.0 km/h"]}),
    dict(id="moon-around", type="around", world="the Moon", look="moon", diameter=3474, gravity="one-sixth of Earth's",
         land="Grey dust everywhere, and above you, a black sky.",
         gravity_line="Gravity is about one-sixth of Earth's, so walking turns into bouncing.",
         extra_line="And there's almost no air at all. It's nearly a vacuum.",
         extra_label="NEARLY A VACUUM",
         facts={"Moon": ["3,474 km", "about one-sixth of Earth's", "regolith dust", "nearly vacuum"],
                "Preferred walking speed": ["5.0 km/h"]}),
    dict(id="mars-weigh", type="weigh", world="Mars", look="mars", ratio=0.38, gravity="38% of Earth's",
         facts={"Mars": ["38% of Earth's surface gravity"]}),
    dict(id="titan-around", type="around", world="Titan", look="titan", diameter=5150, gravity=None,
         land="Saturn's largest moon, wrapped in a thick haze.",
         gravity_line="Its thick atmosphere blocks about 90% of the sunlight before it reaches the ground.",
         extra_line="And it has lakes. Not of water, but of liquid hydrocarbons.",
         extra_label="LAKES, BUT NOT WATER",
         facts={"Titan (moon)": ["5,149.53 km", "about 90% has been absorbed by the thick atmosphere",
                                 "liquid hydrocarbon lakes", "largest moon of Saturn"],
                "Preferred walking speed": ["5.0 km/h"]}),
    dict(id="mercury-around", type="around", world="Mercury", look="mercury", diameter=4880, gravity=None,
         land="The closest planet to the Sun, covered in craters like our Moon.",
         gravity_line="Its gravity is a little weaker than Mars's.",
         extra_line="Some craters near the poles never see sunlight, and may hold water ice.",
         extra_label="ICE IN THE SHADOWS?",
         facts={"Mercury (planet)": ["4,880 km", "surface gravity slightly lower than that of Mars",
                                     "permanently shadowed", "water ice could be present in the craters", "cratered"],
                "Preferred walking speed": ["5.0 km/h"]}),
    dict(id="moon-weigh", type="weigh", world="the Moon", look="moon", ratio=1 / 6, gravity="one-sixth of Earth's",
         facts={"Moon": ["about one-sixth of Earth's"]}),
]
