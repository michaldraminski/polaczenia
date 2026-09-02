import json
import random
import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import requests
from bs4 import BeautifulSoup


# ============================================================
# KONFIGURACJA
# ============================================================

DEFAULT_INPUT = "slownik_bez_rzadkich.json"
DEFAULT_OUTPUT = "crossword.json"

SIZE = 5

MIN_WORD_LENGTH = 3
MAX_WORD_LENGTH = 5

# Ile prób stworzenia planszy
MAX_ATTEMPTS = 500

# Ile różnych układów czarnych pól próbujemy
MAX_BLOCK_PATTERNS = 100


# ============================================================
# SLOT
# ============================================================

@dataclass
class Slot:
    row: int
    col: int
    length: int
    direction: str

    @property
    def cells(self):
        result = []

        if self.direction == "horizontal":
            for i in range(self.length):
                result.append(
                    (self.row, self.col + i)
                )
        else:
            for i in range(self.length):
                result.append(
                    (self.row + i, self.col)
                )

        return result


# ============================================================
# WCZYTYWANIE SŁÓW
# ============================================================
def _clean_clue(text, word=None):
    """Czyści definicję i usuwa techniczne elementy ze źródła."""
    if not text:
        return None

    text = BeautifulSoup(text, "html.parser").get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text).strip()

    # Nie chcemy przypadkowo zapisać elementów nawigacji strony.
    bad_exact = {
        "komentarze",
        "brak",
        "brak definicji",
        "więcej",
        "lista",
        "słownik języka polskiego sjp",
        "info",
    }
    if text.lower() in bad_exact:
        return None

    # Jeśli tekst zawiera numery (np "1. definicja 2. inna"), bierz tylko pierwszą
    match = re.match(r"^(\d+\.\s*)?(.+?)(?:\s*\d+\.|$)", text)
    if match:
        text = match.group(2).strip()

    # Usuń numerację typu "1. " lub "(1)" z początku i końca
    text = re.sub(r"^\d+\.\s*", "", text).strip()
    text = re.sub(r"^\(\d+(?:\.\d+)?\)\s*", "", text).strip()
    text = re.sub(r"\s*\(\d+(?:\.\d+)?\)$", "", text).strip()

    if not text:
        return None

    # Odrzuć clue'y, które wyglądają na junk - same słowa techniczne z numeracją
    if re.match(r"^(info|undefined|brak|puste)\s*(?:\(\d+\))?$", text.lower()):
        return None

    # Jeśli mamy słowo klucza, sprawdź czy definicja go nie zawiera
    if word:
        word_lower = word.lower()
        text_lower = text.lower()
        
        # Unikaj definicji, które zaczynają się od samego słowa lub jego formy
        if text_lower.startswith(word_lower) or text_lower.startswith(f"rodzaj {word_lower}") or \
           text_lower.startswith(f"forma {word_lower}"):
            return None
        
        # Unikaj definicji, które są tylko powtórzeniem słowa
        if text_lower == word_lower:
            return None

    if len(text) > 120:
        text = text[:117].rsplit(" ", 1)[0] + "..."

    return text


def _get_clue_sjp(word):
    """
    Pobiera definicję z SJP.pl.

    Szuka konkretnie w paragrafach i listach, unikając
    technicznych elementów strony.
    """
    url = f"https://sjp.pl/{word}"

    try:
        response = requests.get(
            url,
            timeout=10,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 "
                    "(Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 "
                    "Chrome/140.0 Safari/537.36"
                )
            },
        )

        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        # Szukamy sekcji "znaczenie:" w tekście
        marker = None
        for element in soup.find_all(string=re.compile(r"^\s*znaczenie\s*:", re.I)):
            marker = element.parent
            break

        if marker is None:
            return None

        # Szukamy tylko w paragrafach i elementach listy (dd, li)
        # Po znalezieniu markera "znaczenie:"
        for element in marker.find_all_next():
            # Jeśli natrafimy na nagłówek, kończymy szukanie
            if element.name in {"h1", "h2", "h3"}:
                break

            # Bierzemy tekst tylko z rzeczywistych elementów zawartości
            if element.name not in {"p", "dd", "li", "div"}:
                continue

            value = element.get_text(" ", strip=True)
            if not value:
                continue

            # Usuń marker "znaczenie:" jeśli nadal tam jest
            value = re.sub(r"^\s*znaczenie\s*:\s*", "", value, flags=re.I).strip()
            
            # Oczyść i zwaliduj - przekaż słowo, żeby sprawdzić czy się nie powtarza
            value = _clean_clue(value, word=word)

            if value and len(value) >= 5:
                return value

        return None

    except Exception:
        return None


def _get_clue_wiktionary(word):
    """
    Pobiera pierwszą polską definicję z Wikisłownika.
    Celujemy bezpośrednio w sekcję "znaczenia", dzięki czemu
    nie łapiemy elementów menu strony.
    """
    url = f"https://pl.wiktionary.org/wiki/{word}"

    try:
        response = requests.get(
            url,
            timeout=10,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 "
                    "(Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 "
                    "Chrome/140.0 Safari/537.36"
                )
            },
        )

        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        # Najpierw znajdź sekcję języka polskiego.
        polish_section = None

        for heading in soup.find_all(["h2", "h3"]):
            heading_text = heading.get_text(" ", strip=True).lower()

            if "język polski" in heading_text:
                polish_section = heading
                break

        if polish_section is None:
            return None

        # W obrębie polskiej sekcji znajdź nagłówek "znaczenia".
        meanings_heading = None

        for element in polish_section.find_all_next(["h3", "h4"], limit=30):
            text_value = element.get_text(" ", strip=True).lower()

            if "znaczenia" == text_value:
                meanings_heading = element
                break

            # Jeżeli trafiliśmy na kolejną dużą sekcję, kończymy.
            if element.name == "h2":
                break

        if meanings_heading is None:
            return None

        # Pierwsze <li> po "znaczenia" zawiera zwykle definicję.
        for element in meanings_heading.find_all_next():
            if element.name in {"h2", "h3"}:
                break

            if element.name == "li":
                clue = _clean_clue(element.get_text(" ", strip=True), word=word)

                if clue:
                    return clue

        return None

    except Exception:
        return None


def get_clue(word):
    """
    Pobiera prawdziwą polską definicję słowa.

    Kolejność:
      1. lokalny cache
      2. SJP.pl
      3. Wikisłownik

    Cache zapisujemy w clue_cache.json, żeby przy kolejnych
    uruchomieniach nie odpytwać ponownie tych samych stron.
    """
    cache_file = Path("clue_cache.json")

    try:
        if cache_file.exists():
            with cache_file.open("r", encoding="utf-8") as f:
                cache = json.load(f)
        else:
            cache = {}
    except Exception:
        cache = {}

    word = word.strip().lower()

    if word in cache:
        cached = cache[word]
        return cached if cached else None

    clue = _get_clue_sjp(word)

    if clue is None:
        clue = _get_clue_wiktionary(word)

    # Zapamiętaj również brak definicji, żeby nie odpytwać
    # ponownie tego samego słowa przy kolejnym uruchomieniu.
    cache[word] = clue

    try:
        with cache_file.open("w", encoding="utf-8") as f:
            json.dump(
                cache,
                f,
                ensure_ascii=False,
                indent=2,
            )
    except Exception:
        pass

    return clue


def load_words(filename):
    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    words = set()

    for letter_data in data.values():

        for length in ("3", "4", "5"):

            for word in letter_data.get(length, []):

                word = word.strip().lower()

                if not word:
                    continue

                if len(word) < MIN_WORD_LENGTH:
                    continue

                if len(word) > MAX_WORD_LENGTH:
                    continue

                words.add(word)

    print(f"Wczytano {len(words):,} unikalnych słów.")

    return sorted(words)


# ============================================================
# WZORZEC PLANSZY
# ============================================================

def generate_block_pattern(rng):
    """
    Generuje planszę z czarnymi polami.

    Używamy symetrii rotacyjnej:
    jeśli (r,c) jest czarne, to (4-r,4-c)
    również jest czarne.

    Dzięki temu plansza wygląda bardziej
    jak klasyczna krzyżówka.
    """

    grid = [
        [False for _ in range(SIZE)]
        for _ in range(SIZE)
    ]

    # 5x5 - losujemy kilka pól
    candidates = []

    for r in range(SIZE):
        for c in range(SIZE):

            rr = SIZE - 1 - r
            cc = SIZE - 1 - c

            # środek zostawiamy wolny
            if (r, c) == (2, 2):
                continue

            if (r, c) > (rr, cc):
                continue

            candidates.append((r, c))

    rng.shuffle(candidates)

    # Raczej niewiele czarnych pól.
    block_count = rng.randint(0, 6)

    used = 0

    for r, c in candidates:

        rr = SIZE - 1 - r
        cc = SIZE - 1 - c

        if grid[r][c]:
            continue

        if grid[rr][cc]:
            continue

        grid[r][c] = True
        grid[rr][cc] = True

        used += 1

        if used >= block_count:
            break

    return grid


# ============================================================
# SPRAWDZENIE WZORCA
# ============================================================

def extract_slots(blocks):
    """
    Znajduje wszystkie poziome i pionowe sloty.

    Slot musi mieć minimum 3 pola.
    """

    slots = []

    # --------------------------------------------------------
    # POZIOMO
    # --------------------------------------------------------

    for r in range(SIZE):

        c = 0

        while c < SIZE:

            if blocks[r][c]:
                c += 1
                continue

            start = c

            while c < SIZE and not blocks[r][c]:
                c += 1

            length = c - start

            if length >= MIN_WORD_LENGTH:
                slots.append(
                    Slot(
                        row=r,
                        col=start,
                        length=length,
                        direction="horizontal"
                    )
                )

    # --------------------------------------------------------
    # PIONOWO
    # --------------------------------------------------------

    for c in range(SIZE):

        r = 0

        while r < SIZE:

            if blocks[r][c]:
                r += 1
                continue

            start = r

            while r < SIZE and not blocks[r][c]:
                r += 1

            length = r - start

            if length >= MIN_WORD_LENGTH:
                slots.append(
                    Slot(
                        row=start,
                        col=c,
                        length=length,
                        direction="vertical"
                    )
                )

    return slots


def valid_block_pattern(blocks):
    """
    Odrzuca układy, które mają wolne pola tworzące
    jedno- lub dwuliterowe fragmenty.

    Każdy slot musi mieć długość 3-5.
    """

    slots = extract_slots(blocks)

    # Wszystkie niezamknięte fragmenty muszą być slotami.
    # Jeśli gdzieś powstaje długość 1/2 -> odrzucamy.
    for r in range(SIZE):

        c = 0

        while c < SIZE:

            if blocks[r][c]:
                c += 1
                continue

            start = c

            while c < SIZE and not blocks[r][c]:
                c += 1

            length = c - start

            if length not in (0, 3, 4, 5):
                return False

    for c in range(SIZE):

        r = 0

        while r < SIZE:

            if blocks[r][c]:
                r += 1
                continue

            start = r

            while r < SIZE and not blocks[r][c]:
                r += 1

            length = r - start

            if length not in (0, 3, 4, 5):
                return False

    return True


# ============================================================
# KANDYDACI
# ============================================================

def get_candidates(slot, grid, words_by_length):
    """
    Zwraca słowa pasujące do aktualnego slotu.
    """

    candidates = words_by_length.get(slot.length, [])

    result = []

    for word in candidates:

        fits = True

        for index, (r, c) in enumerate(slot.cells):

            existing = grid[r][c]

            if existing is not None:
                if existing != word[index]:
                    fits = False
                    break

        if fits:
            result.append(word)

    return result


# ============================================================
# WSTAWIANIE SŁOWA
# ============================================================

def place_word(slot, word, grid):
    """
    Wstawia słowo i zwraca informację,
    które pola zmieniliśmy.
    """

    changed = []

    for index, (r, c) in enumerate(slot.cells):

        if grid[r][c] is None:
            grid[r][c] = word[index]
            changed.append((r, c))

    return changed


def undo(changed, grid):
    for r, c in changed:
        grid[r][c] = None


# ============================================================
# BACKTRACKING
# ============================================================

def solve_slots(slots, grid, words_by_length, used_words):
    """
    Backtracking.

    Za każdym razem wybieramy slot z najmniejszą
    liczbą możliwych słów.

    To bardzo mocno ogranicza liczbę prób.
    """

    if not slots:
        return True

    # --------------------------------------------------------
    # Wybierz najbardziej ograniczony slot
    # --------------------------------------------------------

    best_slot = None
    best_candidates = None

    for slot in slots:

        candidates = get_candidates(
            slot,
            grid,
            words_by_length
        )

        # Nie używamy tego samego słowa ponownie.
        candidates = [
            word
            for word in candidates
            if word not in used_words
        ]

        if not candidates:
            return False

        if (
            best_candidates is None
            or len(candidates) < len(best_candidates)
        ):
            best_slot = slot
            best_candidates = candidates

    # Losowa kolejność -> różne krzyżówki
    random.shuffle(best_candidates)

    remaining_slots = [
        slot
        for slot in slots
        if slot is not best_slot
    ]

    # --------------------------------------------------------
    # Próby
    # --------------------------------------------------------

    for word in best_candidates:

        changed = place_word(
            best_slot,
            word,
            grid
        )

        used_words.add(word)

        if solve_slots(
            remaining_slots,
            grid,
            words_by_length,
            used_words
        ):
            return True

        used_words.remove(word)

        undo(
            changed,
            grid
        )

    return False


# ============================================================
# WALIDACJA ROZWIĄZANIA
# ============================================================

def validate_solution(slots, grid, used_words):
    """
    Dodatkowa kontrola.
    """

    if len(used_words) != len(slots):
        return False

    for slot in slots:

        chars = []

        for r, c in slot.cells:

            if grid[r][c] is None:
                return False

            chars.append(
                grid[r][c]
            )

        word = "".join(chars)

        if word not in used_words:
            return False

    return True


# ============================================================
# FORMATOWANIE
# ============================================================

def create_output(blocks, slots, grid):

    words = []

    for slot in slots:

        word = "".join(
            grid[r][c]
            for r, c in slot.cells
        )
        clue = get_clue(word)
        entry = {
            "word": word,
            "row": slot.row,
            "col": slot.col,
            "length": slot.length,
            "direction": slot.direction,
            "clue": clue if clue else "Brak definicji"
        }

        words.append(entry)

    return {
        "size": SIZE,

        "grid": [
            [
                "#" if blocks[r][c]
                else grid[r][c]
                for c in range(SIZE)
            ]
            for r in range(SIZE)
        ],

        "words": words
    }


# ============================================================
# WYŚWIETLANIE
# ============================================================

def print_board(data):

    print()
    print("PLANSZA")
    print("-" * 20)

    for row in data["grid"]:

        print(
            " ".join(
                cell if cell != "#" else "■"
                for cell in row
            )
        )

    print()

    print("POZIOMO:")

    for word in data["words"]:
        if word["direction"] == "horizontal":
            print(
                f'  {word["word"]} '
                f'({word["row"] + 1},{word["col"] + 1})'
            )

    print()

    print("PIONOWO:")

    for word in data["words"]:
        if word["direction"] == "vertical":
            print(
                f'  {word["word"]} '
                f'({word["row"] + 1},{word["col"] + 1})'
            )


# ============================================================
# GENEROWANIE
# ============================================================

def generate_crossword(words, seed=None):

    rng = random.Random(seed)

    words_by_length = {
        3: [],
        4: [],
        5: []
    }

    for word in words:
        words_by_length[len(word)].append(word)

    # --------------------------------------------------------
    # Próby
    # --------------------------------------------------------

    for attempt in range(1, MAX_ATTEMPTS + 1):

        blocks = generate_block_pattern(rng)

        if not valid_block_pattern(blocks):
            continue

        slots = extract_slots(blocks)

        # Musimy mieć zarówno poziome,
        # jak i pionowe hasła.
        horizontal_count = sum(
            1
            for slot in slots
            if slot.direction == "horizontal"
        )

        vertical_count = sum(
            1
            for slot in slots
            if slot.direction == "vertical"
        )

        if horizontal_count == 0:
            continue

        if vertical_count == 0:
            continue

        # ----------------------------------------------------
        # Pusta plansza
        # ----------------------------------------------------

        grid = [
            [
                None if not blocks[r][c]
                else "#"
                for c in range(SIZE)
            ]
            for r in range(SIZE)
        ]

        used_words = set()

        # ----------------------------------------------------
        # Rozwiązanie
        # ----------------------------------------------------

        if solve_slots(
            slots,
            grid,
            words_by_length,
            used_words
        ):

            if not validate_solution(
                slots,
                grid,
                used_words
            ):
                continue

            return create_output(
                blocks,
                slots,
                grid
            )

    return None


# ============================================================
# MAIN
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description="Generator polskiej krzyżówki 5x5"
    )

    parser.add_argument(
        "--input",
        default=DEFAULT_INPUT,
        help="Plik JSON ze słowami"
    )

    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help="Plik wynikowy JSON"
    )

    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Seed losowania"
    )

    args = parser.parse_args()

    # --------------------------------------------------------
    # Słownik
    # --------------------------------------------------------

    words = load_words(
        args.input
    )

    # --------------------------------------------------------
    # Generowanie
    # --------------------------------------------------------

    print("Generowanie krzyżówki...")

    crossword = generate_crossword(
        words,
        seed=args.seed
    )

    if crossword is None:

        print()
        print(
            "[ERROR] Nie udało się wygenerować krzyżówki."
        )

        print(
            "Spróbuj innego --seed albo zwiększ "
            "MAX_ATTEMPTS."
        )

        return

    # --------------------------------------------------------
    # Zapis
    # --------------------------------------------------------

    with open(
        args.output,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            crossword,
            f,
            ensure_ascii=False,
            indent=2
        )

    print_board(crossword)

    print()
    print(
        f"Zapisano do: {args.output}"
    )


if __name__ == "__main__":
    main()