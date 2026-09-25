"""The channel's two queues: walk routes and "your country" questions.

Walk routes are answered by routes.py from real borders, so the list only has to
say which pairs to ask about. The questions are different: each is a list of
facts, and a list of countries is exactly what a language model gets
confidently, quietly wrong. So these are curated and checked here by hand, and
the narration is built from them by template.

Order follows the research (vidIQ outliers, September 2026): India-origin walks
and "your country" border questions were the breakout topics.
"""

# Alternates YES and NO, and spreads the NO answers over different seas: ten
# Bering Strait endings in twenty videos (the first list) is one video twenty
# times. Every origin is on a continent: from an island (UK, Philippines,
# Indonesia) the straight shot at the destination is not the least-water route,
# so "stopped by 3,062 km of ocean" would mislead. One gap per route, always.
WALKS = [
    ("India", "United States of America"),      # NO  Bering Strait
    ("India", "Portugal"),                      # YES  (2nd YouTube suggestion for "can you walk from")
    ("Pakistan", "United Kingdom"),             # NO  English Channel (tunnel note)
    ("India", "Australia"),                     # NO  sea + Indonesia's islands
    ("Brazil", "United States of America"),     # YES (Darien)
    ("India", "Japan"),                         # NO  Korea Strait
    ("South Africa", "Russia"),                 # YES
    ("India", "Sri Lanka"),                     # NO  Palk Strait
    ("Argentina", "Canada"),                    # YES
    ("Portugal", "Argentina"),                  # NO  Bering, the long way round
    ("India", "Germany"),                       # YES
    ("Nigeria", "United Kingdom"),              # NO  English Channel
    ("Morocco", "India"),                       # YES
    ("United States of America", "South Africa"),  # NO  Bering, reversed
    ("Egypt", "China"),                         # YES
    ("Mozambique", "Madagascar"),               # NO  Mozambique Channel
    ("France", "Vietnam"),                      # YES
    ("India", "Brazil"),                        # NO  Bering (3rd suggestion)
    ("Mexico", "Argentina"),                    # YES
    ("Norway", "South Africa"),                 # YES
]

# Each item: country (Natural Earth NAME), optional neighbour, the spoken line,
# optional fixed view {lon, lat, dlat} for places no country outline frames well,
# and pin=True for countries too small to see from orbit.
# "hook" is the first line (it has one second to stop the scroll); "seo_title"
# and "tags" use the phrases people type into YouTube search.
#
# Checked 2026-09-25: Canada and Denmark are NOT one-neighbour countries any
# more - they have shared a land border on Hans Island since 2022 (which our
# own far-apart-borders video says). France borders 11 countries counting its
# lands overseas, more than Brazil's 10.
QUESTIONS = [
    {
        "id": "one-neighbour-1",
        "title": "Countries with only ONE neighbour",
        "hook": "These countries have only ONE neighbour. How many can you name?",
        "items": [
            {"country": "Portugal", "neighbour": "Spain", "line": "Portugal. Only Spain."},
            {"country": "Ireland", "neighbour": "United Kingdom", "line": "Ireland. Only the UK."},
            {"country": "South Korea", "neighbour": "North Korea",
             "line": "South Korea. Only North Korea."},
            {"country": "Haiti", "neighbour": "Dominican Rep.",
             "line": "Haiti. Only the Dominican Republic."},
            {"country": "Qatar", "neighbour": "Saudi Arabia", "line": "Qatar. Only Saudi Arabia."},
            {"country": "Monaco", "neighbour": "France", "pin": True,
             "view": {"lon": 7.42, "lat": 43.74, "dlat": 3.0},
             "line": "Monaco. Only France."},
            {"country": "Gambia", "neighbour": "Senegal",
             "line": "Gambia. Wrapped almost completely by Senegal."},
        ],
        "payoff": "Does your country have just one neighbour?",
        "seo_title": "Countries That Only Border ONE Country 🌍 How Many Can You Name?",
        "tags": ["countries that only border one country", "countries with only one neighbour",
                 "countries with one neighbor", "geography quiz", "country borders"],
    },
    {
        "id": "inside-another",
        "title": "Countries completely INSIDE another country",
        "hook": "Only three countries sit completely inside another country. Can you name them?",
        "items": [
            {"country": "Lesotho", "neighbour": "South Africa",
             "line": "Lesotho. Surrounded on every side by South Africa."},
            {"country": "San Marino", "neighbour": "Italy", "pin": True,
             "view": {"lon": 12.46, "lat": 43.94, "dlat": 3.2},
             "line": "San Marino. Surrounded by Italy."},
            {"country": "Vatican", "neighbour": "Italy", "pin": True,
             "view": {"lon": 12.45, "lat": 41.90, "dlat": 3.2},
             "line": "Vatican City. Inside the city of Rome."},
        ],
        "payoff": "Three countries, and you cannot leave any of them without entering another.",
        "seo_title": "3 Countries Completely Inside Another Country 🌍",
        "tags": ["countries inside another country", "enclave countries", "lesotho",
                 "san marino", "vatican city", "geography facts"],
    },
    {
        "id": "most-neighbours",
        "title": "Countries with the MOST neighbours",
        "hook": "Which country has the most neighbours? Take a guess.",
        "items": [
            {"country": "Germany", "line": "Germany borders 9 countries."},
            {"country": "Dem. Rep. Congo", "line": "DR Congo borders 9."},
            {"country": "Brazil", "line": "Brazil borders 10."},
            {"country": "France", "line": "France borders 11, counting its lands overseas."},
            {"country": "Russia", "line": "Russia borders 14."},
            {"country": "China", "line": "And China also borders 14."},
        ],
        "payoff": "How many countries does yours touch?",
        "seo_title": "Which Country Has the MOST Neighbours? 🌍",
        "tags": ["country with most neighbors", "countries with the most borders",
                 "china borders", "russia borders", "geography quiz"],
    },
    {
        "id": "double-landlocked",
        "title": "Only 2 countries are DOUBLE landlocked",
        "hook": "Only two countries on Earth are double landlocked. Know them?",
        "items": [
            {"country": "Liechtenstein", "pin": True,
             "view": {"lon": 9.55, "lat": 47.16, "dlat": 4.0},
             "line": "Liechtenstein. Its neighbours, Switzerland and Austria, have no sea either."},
            {"country": "Uzbekistan",
             "line": "Uzbekistan. Every single neighbour is landlocked too."},
        ],
        "payoff": "To reach the ocean from either, you must cross at least two countries.",
        "seo_title": "The Only 2 Double Landlocked Countries 🌍",
        "tags": ["double landlocked countries", "double landlocked country in the world",
                 "landlocked countries", "liechtenstein", "uzbekistan"],
    },
    {
        "id": "far-apart-borders",
        "title": "Far-apart countries that SHARE a border",
        "hook": "France shares a border with Brazil. Wait, what?",
        "items": [
            {"country": "France", "neighbour": "Brazil",
             "view": {"lon": -53.0, "lat": 3.8, "dlat": 12},
             "line": "France and Brazil, through French Guiana in South America."},
            {"country": "France", "neighbour": "Netherlands", "pin": True,
             "view": {"lon": -63.05, "lat": 18.06, "dlat": 2.4},
             "line": "France and the Netherlands, on the tiny island of Saint Martin."},
            {"country": "Spain", "neighbour": "Morocco",
             "view": {"lon": -5.3, "lat": 35.6, "dlat": 3.0},
             "line": "Spain and Morocco, in the cities of Ceuta and Melilla."},
            {"country": "Denmark", "neighbour": "Canada", "pin": True,
             "view": {"lon": -66.45, "lat": 80.3, "dlat": 7},
             "line": "Denmark and Canada, since they split Hans Island in 2022."},
        ],
        "payoff": "Borders do not always sit where you expect them.",
        "seo_title": "France Borders Brazil?! Surprising Country Borders 🌍",
        "tags": ["france brazil border", "french guiana", "hans island", "saint martin",
                 "strange borders", "weird borders"],
    },
    {
        "id": "city-countries",
        "title": "Countries that are just ONE city",
        "hook": "Some countries are just one single city. Can you name them?",
        "items": [
            {"country": "Singapore", "pin": True,
             "view": {"lon": 103.82, "lat": 1.35, "dlat": 3.0},
             "line": "Singapore. The whole country is one city."},
            {"country": "Monaco", "pin": True,
             "view": {"lon": 7.42, "lat": 43.74, "dlat": 3.0},
             "line": "Monaco. Smaller than New York's Central Park."},
            {"country": "Vatican", "pin": True,
             "view": {"lon": 12.45, "lat": 41.90, "dlat": 3.0},
             "line": "Vatican City. The smallest country on Earth."},
        ],
        "payoff": "Could you name a fourth?",
        "seo_title": "City Countries: Nations That Are Just ONE City 🌍",
        "tags": ["city countries", "city states", "singapore", "monaco", "vatican city",
                 "smallest countries"],
    },
    {
        "id": "one-neighbour-2",
        "title": "More countries with only ONE neighbour",
        "hook": "More countries with only ONE neighbour. Is yours one of them?",
        "items": [
            {"country": "Dominican Rep.", "neighbour": "Haiti",
             "line": "The Dominican Republic. Only Haiti."},
            {"country": "United Kingdom", "neighbour": "Ireland", "line": "The UK. Only Ireland."},
            {"country": "Brunei", "neighbour": "Malaysia", "line": "Brunei. Only Malaysia."},
            {"country": "Timor-Leste", "neighbour": "Indonesia",
             "line": "Timor-Leste. Only Indonesia."},
            {"country": "Papua New Guinea", "neighbour": "Indonesia",
             "line": "Papua New Guinea. Only Indonesia."},
            {"country": "Lesotho", "neighbour": "South Africa",
             "line": "Lesotho. Only South Africa."},
        ],
        "payoff": "Which one surprised you most?",
        "seo_title": "More Countries That Only Border ONE Country 🌍",
        "tags": ["countries that only border one country", "countries with one neighbor",
                 "brunei", "timor leste", "papua new guinea", "geography quiz"],
    },
]
