import json
from wordfreq import word_frequency

# Wczytaj Twój słownik
with open("polskie_slowa.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Progi częstotliwości (sprawdzone w praktyce)
# freq > 1e-4  → bardzo częste
# freq > 1e-6  → średnie
# freq <= 1e-7 → rzadkie / dziwne / archaiczne / techniczne
THRESHOLD = 1e-7

def is_common(word):
    return word_frequency(word, "pl") > THRESHOLD

filtered = {}

for letter, lengths in data.items():
    filtered[letter] = {
        "3": [w for w in lengths["3"] if is_common(w)],
        "4": [w for w in lengths["4"] if is_common(w)],
        "5": [w for w in lengths["5"] if is_common(w)],
    }

with open("slownik_bez_rzadkich.json", "w", encoding="utf-8") as f:
    json.dump(filtered, f, ensure_ascii=False, indent=2)

print("✔ Gotowe: usunięto rzadkie słowa.")
