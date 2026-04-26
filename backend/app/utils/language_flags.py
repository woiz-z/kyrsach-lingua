import re

import pycountry

LANG_TO_COUNTRY = {
    "af": "za",
    "am": "et",
    "ar": "sa",
    "az": "az",
    "be": "by",
    "bn": "bd",
    "bs": "ba",
    "ca": "es",
    "cs": "cz",
    "cy": "gb",
    "da": "dk",
    "el": "gr",
    "en": "gb",
    "et": "ee",
    "eu": "es",
    "fa": "ir",
    "ga": "ie",
    "gl": "es",
    "ha": "ng",
    "he": "il",
    "hi": "in",
    "hy": "am",
    "ig": "ng",
    "ja": "jp",
    "jv": "id",
    "ka": "ge",
    "kk": "kz",
    "km": "kh",
    "ko": "kr",
    "ky": "kg",
    "lo": "la",
    "mi": "nz",
    "ms": "my",
    "my": "mm",
    "nb": "no",
    "ne": "np",
    "nn": "no",
    "no": "no",
    "pt": "pt",
    "si": "lk",
    "sl": "si",
    "sq": "al",
    "sr": "rs",
    "su": "id",
    "sv": "se",
    "sw": "ke",
    "ta": "in",
    "te": "in",
    "tg": "tj",
    "tk": "tm",
    "tl": "ph",
    "uk": "ua",
    "ur": "pk",
    "vi": "vn",
    "xh": "za",
    "yo": "ng",
    "zh": "cn",
    "zu": "za",
}

COUNTRY_CODES = {
    str(getattr(country, "alpha_2", "")).lower()
    for country in pycountry.countries
    if getattr(country, "alpha_2", None)
}


def country_code_to_flag(country_code: str) -> str:
    letters = (country_code or "").upper()
    if len(letters) != 2 or not letters.isalpha():
        return "🌐"
    return "".join(chr(127397 + ord(ch)) for ch in letters)


def infer_flag_for_language_code(language_code: str) -> str:
    code = re.sub(r"[^a-z]", "", (language_code or "").lower())
    if len(code) < 2:
        return "🌐"

    preferred = LANG_TO_COUNTRY.get(code)
    if preferred:
        return country_code_to_flag(preferred)

    if code[:2] in COUNTRY_CODES:
        return country_code_to_flag(code[:2])

    return "🌐"