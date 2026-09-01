import gzip
import json
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

# ============================================================
# KONFIGURACJA
# ============================================================

# Słownik SGJP udostępniany przez Morfeusz.
# Zmieniaj tylko jeśli chcesz użyć innej wersji.
SGJP_URL = (
    "https://download.sgjp.pl/morfeusz/20250831/"
    "sgjp-20250831.tab.gz"
)

OUTPUT_FILE = "polskie_slowa.json"

MAX_PER_GROUP = 1000

WORD_LENGTHS = {3, 4, 5}

POLISH_LETTERS = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ"

VALID_WORD = re.compile(
    r"^[a-ząćęłńóśźż]+$",
    re.IGNORECASE
)


# ============================================================
# POBIERANIE
# ============================================================

def download_dictionary():
    filename = "sgjp-20250831.tab.gz"

    print("Pobieranie słownika SGJP...")
    print(SGJP_URL)

    urllib.request.urlretrieve(
        SGJP_URL,
        filename
    )

    print(f"Pobrano: {filename}")

    return filename


# ============================================================
# CZYTANIE SGJP
# ============================================================

def read_sgjp(filename):
    """
    Czyta plik SGJP .tab.gz.

    SGJP zawiera informacje fleksyjne.
    Interesują nas przede wszystkim:
        forma
        lemat
        tag

    Zwracamy kandydatów będących formami podstawowymi.
    """

    words = set()

    print("Czytanie danych SGJP...")

    with gzip.open(filename, "rt", encoding="utf-8") as f:

        for line_number, line in enumerate(f, 1):

            line = line.rstrip("\n")

            if not line:
                continue

            parts = line.split("\t")

            if len(parts) < 3:
                continue

            form = parts[0].strip().lower()
            lemma = parts[1].strip().lower()
            tag = parts[2].strip()

            # ------------------------------------------------
            # Podstawowe filtrowanie
            # ------------------------------------------------

            if len(form) not in WORD_LENGTHS:
                continue

            if form != lemma:
                continue

            if not VALID_WORD.fullmatch(form):
                continue

            # ------------------------------------------------
            # Mianownik
            # ------------------------------------------------
            #
            # W SGJP:
            #   nom = mianownik
            #
            # Szukamy wyłącznie form mianownikowych.
            #
            if "nom" not in tag:
                continue

            words.add(form)

            if line_number % 500000 == 0:
                print(
                    f"  przetworzono {line_number:,} rekordów..."
                )

    print(f"Znaleziono kandydatów: {len(words):,}")

    return words


# ============================================================
# DALSZE CZYSZCZENIE
# ============================================================

def clean_words(words):
    """
    Dodatkowe czyszczenie pod kątem gry słownej.
    """

    cleaned = set()

    for word in words:

        word = word.lower().strip()

        # tylko 3/4/5 liter
        if len(word) not in WORD_LENGTHS:
            continue

        # wyłącznie polskie litery
        if not VALID_WORD.fullmatch(word):
            continue

        # nie dopuszczamy słów z powtarzającymi się
        # znakami specjalnymi itp.
        if not word.isalpha():
            continue

        cleaned.add(word)

    return cleaned


# ============================================================
# BUDOWANIE JSON
# ============================================================

def build_dictionary(words):

    result = {
        letter: {
            "3": [],
            "4": [],
            "5": []
        }
        for letter in POLISH_LETTERS
    }

    grouped = defaultdict(set)

    for word in words:

        letter = word[0].upper()
        length = str(len(word))

        if letter not in result:
            continue

        grouped[(letter, length)].add(word)

    # --------------------------------------------------------
    # Sortowanie
    # --------------------------------------------------------

    for letter in POLISH_LETTERS:

        for length in ("3", "4", "5"):

            values = sorted(
                grouped[(letter, length)]
            )

            # maksymalnie 1000
            values = values[:MAX_PER_GROUP]

            result[letter][length] = values

    return result


# ============================================================
# ZAPIS
# ============================================================

def save_json(data):

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )

    print()
    print(f"Zapisano: {OUTPUT_FILE}")


# ============================================================
# STATYSTYKI
# ============================================================

def print_statistics(data):

    print()
    print("=" * 60)
    print("STATYSTYKI")
    print("=" * 60)

    total = 0

    for letter in POLISH_LETTERS:

        c3 = len(data[letter]["3"])
        c4 = len(data[letter]["4"])
        c5 = len(data[letter]["5"])

        subtotal = c3 + c4 + c5
        total += subtotal

        print(
            f"{letter:2} | "
            f"3: {c3:4} | "
            f"4: {c4:4} | "
            f"5: {c5:4} | "
            f"razem: {subtotal:4}"
        )

    print("-" * 60)
    print(f"RAZEM: {total:,}")
    print("=" * 60)


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("POLSKI SŁOWNIK DO GENERATORA KRZYŻÓWEK")
    print("=" * 60)
    print()

    dictionary_file = Path(
        "sgjp-20250831.tab.gz"
    )

    # --------------------------------------------
    # Pobieranie tylko jeśli pliku nie ma
    # --------------------------------------------

    if not dictionary_file.exists():
        download_dictionary()
    else:
        print(
            f"Używam istniejącego pliku: "
            f"{dictionary_file}"
        )

    print()

    # --------------------------------------------
    # SGJP
    # --------------------------------------------

    words = read_sgjp(
        dictionary_file
    )

    # --------------------------------------------
    # Czyszczenie
    # --------------------------------------------

    words = clean_words(words)

    print(
        f"Po czyszczeniu: {len(words):,}"
    )

    # --------------------------------------------
    # JSON
    # --------------------------------------------

    dictionary = build_dictionary(
        words
    )

    save_json(dictionary)

    print_statistics(
        dictionary
    )

    print()
    print("Gotowe.")


if __name__ == "__main__":
    main()