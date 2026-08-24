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
- podpowiedź „Brakuje jednego!”,
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

Możesz uruchomić aplikację w kontenerze produkcyjnym z użyciem Docker Compose.

1. Skopiuj przykładowe zmienne środowiskowe:

```powershell
Copy-Item .env.example .env.local
```

2. Ustaw prawidłowe wartości dla Supabase w pliku `.env.local`.

3. Uruchom aplikację:

```powershell
docker compose up --build
```

Aplikacja będzie dostępna pod adresem:

```text
http://localhost:3000
```

Możesz też zbudować obraz ręcznie:

```powershell
docker build -t polaczenia .
docker run --rm -p 3000:3000 --env-file .env.local polaczenia
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
