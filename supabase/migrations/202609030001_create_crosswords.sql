alter table public.puzzles
    add column if not exists game_type text not null default 'connections';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'puzzles_game_type_valid'
          and conrelid = 'public.puzzles'::regclass
    ) then
        alter table public.puzzles
            add constraint puzzles_game_type_valid
            check (game_type in ('connections', 'crossword'));
    end if;
end;
$$;

alter table public.puzzles
    drop constraint if exists puzzles_publication_date_key;

create unique index if not exists puzzles_game_publication_date_key
    on public.puzzles(game_type, publication_date)
    where publication_date is not null;

create table if not exists public.crossword_puzzles (
    puzzle_id bigint primary key references public.puzzles(id) on delete cascade,
    size smallint not null check (size between 3 and 25),
    grid jsonb not null,
    generator_seed integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.crossword_entries (
    id bigint generated always as identity primary key,
    puzzle_id bigint not null references public.puzzles(id) on delete cascade,
    number smallint not null,
    direction text not null check (direction in ('horizontal', 'vertical')),
    row_index smallint not null,
    column_index smallint not null,
    length smallint not null check (length between 3 and 25),
    answer text not null,
    clue text not null,
    position smallint not null,
    unique (puzzle_id, direction, number)
);

create index if not exists crossword_entries_puzzle_id_index
    on public.crossword_entries(puzzle_id);

grant select, insert, update on table public.puzzles to service_role;
grant select, insert, update on table public.crossword_puzzles to service_role;
grant select, insert, update on table public.crossword_entries to service_role;
grant usage, select on all sequences in schema public to service_role;