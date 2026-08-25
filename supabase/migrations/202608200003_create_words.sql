create table if not exists public.words (
    id bigint generated always as identity primary key,

    category_id bigint not null
        references public.categories(id)
        on delete cascade,

    value text not null,

    position smallint not null,

    created_at timestamptz not null default now(),

    constraint words_value_not_empty
        check (length(trim(value)) > 0),

    constraint words_position_valid
        check (position between 1 and 4),

    constraint words_unique_position
        unique (category_id, position),

    constraint words_unique_value_in_category
        unique (category_id, value)
);

create index if not exists words_category_id_index
    on public.words(category_id);