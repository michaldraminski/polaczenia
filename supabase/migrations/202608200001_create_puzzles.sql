create table public.puzzles (
    id bigint generated always as identity primary key,

    title text not null,

    publication_date date unique,

    status text not null default 'draft',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint puzzles_title_not_empty
        check (length(trim(title)) > 0),

    constraint puzzles_status_valid
        check (
            status in (
                'draft',
                'scheduled',
                'archived'
            )
        ),

    constraint scheduled_puzzle_requires_date
        check (
            status <> 'scheduled'
            or publication_date is not null
        )
);