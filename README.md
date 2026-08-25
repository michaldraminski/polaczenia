# Połączenia

Polska gra słowna inspirowana formatem Connections.

Zadaniem gracza jest podzielenie 16 słów na 4 kategorie po 4 powiązane elementy. Gracz ma cztery próby na znalezienie wszystkich kategorii.

## Demo

Aplikacja: **https://polaczenia.vercel.app/**

## Funkcje

- codzienna plansza 4 × 4,
- losowa kolejność słów,
- zaznaczanie i sprawdzanie grup,
- cztery próby,
- podpowiedź „Blisko!”,
- poziomy trudności kategorii,
- pokazanie rozwiązania po przegranej,
- panel administratora,
- tworzenie i edycja plansz,
- planowanie plansz na wybrane dni,
- archiwizowanie plansz,
- logowanie administratora.

## Technologie

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
  - PostgreSQL
  - Auth
  - Data API
- Vercel

## Uruchomienie lokalne

### Wymagania

- Node.js 22 LTS
- npm
- Git

### Instalacja

```powershell
git clone WSTAW_TUTAJ_ADRES_REPOZYTORIUM
cd polaczenia
npm install
```

Utwórz w głównym katalogu projektu plik `.env.local`:

```env
SUPABASE_URL=https://PROJEKT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SUPABASE_URL=https://PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Następnie uruchom aplikację:

```powershell
npm run dev
```

Aplikacja będzie dostępna pod adresem:

```text
http://localhost:3000
```

Panel administratora:

```text
http://localhost:3000/admin
```

## Docker

### Lokalny development

Do szybkiego uruchomienia aplikacji w trybie deweloperskim bez dodatkowych usług:

1. Skopiuj przykładowe zmienne środowiskowe:

```powershell
Copy-Item .env.example .env.local
```

2. Ustaw prawidłowe wartości Supabase w pliku `.env.local`.

3. Uruchom kontener deweloperski:

```powershell
docker compose -f docker-compose.dev.yml up --build
```

Aplikacja będzie dostępna pod adresem:

```text
http://localhost:3000
```

To polecenie montuje katalog projektu do kontenera i uruchamia `next dev` z widocznością na porcie 3000.

### Produkcja

Możesz uruchomić aplikację w kontenerze produkcyjnym z użyciem Docker Compose.

```powershell
docker compose up --build
```

Uwaga dotycząca zmiennych środowiskowych i budowania obrazu

- Next.js wymaga pewnych zmiennych środowiskowych zarówno w czasie budowy (build), jak i w czasie uruchomienia (runtime).
- W tym repozytorium Docker Compose przekazuje dwie zmienne jako build-args (zdefiniowane w `docker-compose.yml`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  Te wartości muszą być dostępne podczas `docker build` — Docker Compose pobiera je z pliku `.env` w katalogu projektu lub z otoczenia powłoki, nie z pliku `.env.local`.
- W czasie działania aplikacji kontener powinien otrzymać także zmienne serwerowe używane przez backend/Supabase:
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - (oraz ponownie) `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Przykładowy minimalny plik `.env` (W KATALOGU PROJEKTU, NIE W REPO):

```env
# build-time (public keys exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://projekt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# runtime (keep secret, do NOT commit)
SUPABASE_URL=https://projekt.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

- Nie dodawaj pliku `.env` do repozytorium. Plik `.env.local` używany przez Next.js lokalnie nie jest automatycznie używany przez Docker build; skopiowanie lub przeniesienie wymaganych wartości do `.env` (tymczasowo) rozwiązuje problem przy buildzie.

Jak dostarczyć zmienne przy budowie/uruchomieniu

- Sposób 1 (najprostszy): utwórz `.env` z powyższymi wartościami i uruchom:

```powershell
docker compose up --build
```

- Sposób 2 (jednorazowo, z powłoki):

```powershell
NEXT_PUBLIC_SUPABASE_URL="https://..." NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..." docker compose up --build
```

- Sposób 3 (eksport w sesji powłoki):

```powershell
export NEXT_PUBLIC_SUPABASE_URL="https://..."
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."
export SUPABASE_URL="https://..."
export SUPABASE_SECRET_KEY="..."
docker compose up --build
```

Diagnostyka błędów builda

- Jeśli build zakończy się błędem podobnym do:

  Error: Brakuje konfiguracji Supabase Auth.

  lub

  failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

  to najczęściej oznacza, że wymagane wartości (szczególnie `NEXT_PUBLIC_*`) nie były dostępne w trakcie budowy i Next.js nie mógł poprawnie prerenderować stron (np. `/admin`).

- Aby zobaczyć pełne logi Next.js podczas budowy uruchom:

```powershell
docker compose build --no-cache --progress=plain
```

- Po naprawieniu wartości środowiskowych uruchom ponownie:

```powershell
docker compose up --build
```

Dodatkowe uwagi

- `docker-compose.dev.yml` w trybie deweloperskim odnosi się do `Dockerfile.dev`. Jeśli tego pliku nie ma lokalnie, używaj polecenia uruchamiającego `npm run dev` lub stwórz `Dockerfile.dev` zgodny z wymaganiami developmentu.
- Nie zapisuj i nie commituj sekretów (`SUPABASE_SECRET_KEY`, itp.). Traktuj je jak poufne dane i przechowuj w bezpiecznym miejscu (secrets manager) dla środowisk produkcyjnych.

Możesz też zbudować obraz ręcznie i uruchomić lokalnie (runtime z plikiem env):

```powershell
docker build -t polaczenia .
docker run --rm -p 3000:3000 --env-file .env polaczenia
```


## Build produkcyjny

```powershell
npm run build
npm run start
```

## Struktura projektu

```text
app/
├── admin/              panel administratora
├── api/                endpointy backendowe
└── page.tsx            strona główna gry

components/
└── Game.tsx            interfejs i logika rozgrywki

lib/
├── supabase/           konfiguracja klientów Supabase
├── puzzles.ts          pobieranie bieżącej planszy
└── admin-puzzles.ts    obsługa plansz w panelu administratora

types/
└── game.ts             typy TypeScript

supabase/
└── migrations/         migracje bazy danych
```

## Model danych

```text
puzzles
    1:N
categories
    1:N
words
```

Jedna plansza zawiera cztery kategorie, a każda kategoria zawiera cztery słowa.

Plansza jest dostępna publicznie, jeśli:

- ma status `scheduled`,
- jej data publikacji odpowiada bieżącej dacie w strefie `Europe/Warsaw`.

## Statusy plansz

- `draft` — szkic,
- `scheduled` — plansza zaplanowana do publikacji,
- `archived` — plansza archiwalna.

## Bezpieczeństwo

Plik `.env.local` nie może zostać dodany do repozytorium.

W szczególności nie należy udostępniać wartości:

```text
SUPABASE_SECRET_KEY
```

Publiczna rejestracja użytkowników jest wyłączona. Konta administratorów są tworzone ręcznie w Supabase Auth.


## Planowane funkcje

- dopracowany ekran końcowy,
- kopiowanie wyniku,
- archiwum poprzednich plansz,
- możliwość przesyłania sugestii przez użytkowników,
- usprawnienia dostępności,
- dalsze poprawki wyglądu na urządzeniach mobilnych.
