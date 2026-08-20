create table public.categories (
    id bigint generated always as identity primary key,

    puzzle_id bigint not null
        references public.puzzles(id)
        on delete cascade,

    name text not null,

    difficulty smallint not null,

    created_at timestamptz not null default now(),

    constraint categories_name_not_empty
        check (length(trim(name)) > 0),

    constraint categories_difficulty_valid
        check (difficulty between 1 and 4),

    constraint categories_unique_difficulty
        unique (puzzle_id, difficulty),

    constraint categories_unique_name
        unique (puzzle_id, name)
);

create index categories_puzzle_id_index
    on public.categories(puzzle_id);