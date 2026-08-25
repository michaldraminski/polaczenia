alter table public.puzzles
    add column if not exists created_by_user_id uuid references auth.users(id),
    add column if not exists last_edited_by_user_id uuid references auth.users(id);

comment on column public.puzzles.created_by_user_id is 'Moderator, który utworzył planszę.';
comment on column public.puzzles.last_edited_by_user_id is 'Moderator, który ostatnio edytował planszę.';

create or replace function public.create_puzzle(
    puzzle_title text,
    puzzle_publication_date date,
    puzzle_status text,
    puzzle_categories jsonb,
    puzzle_created_by_user_id uuid default null,
    puzzle_last_edited_by_user_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    new_puzzle_id bigint;
    new_category_id bigint;
    category_data jsonb;
    word_value jsonb;
    category_index integer;
    word_index integer;
begin
    if length(trim(puzzle_title)) = 0 then
        raise exception 'Tytuł planszy nie może być pusty.';
    end if;

    if puzzle_status not in ('draft', 'scheduled') then
        raise exception 'Niepoprawny status planszy.';
    end if;

    if puzzle_status = 'scheduled'
       and puzzle_publication_date is null then
        raise exception 'Zaplanowana plansza musi mieć datę.';
    end if;

    if jsonb_array_length(puzzle_categories) <> 4 then
        raise exception 'Plansza musi zawierać cztery kategorie.';
    end if;

    insert into public.puzzles (
        title,
        publication_date,
        status,
        created_by_user_id,
        last_edited_by_user_id
    )
    values (
        trim(puzzle_title),
        puzzle_publication_date,
        puzzle_status,
        puzzle_created_by_user_id,
        coalesce(puzzle_last_edited_by_user_id, puzzle_created_by_user_id)
    )
    returning id into new_puzzle_id;

    for category_index in 0..3 loop
        category_data :=
            puzzle_categories -> category_index;

        if length(
            trim(category_data ->> 'name')
        ) = 0 then
            raise exception 'Nazwa kategorii nie może być pusta.';
        end if;

        if jsonb_array_length(
            category_data -> 'words'
        ) <> 4 then
            raise exception 'Kategoria musi zawierać cztery słowa.';
        end if;

        insert into public.categories (
            puzzle_id,
            name,
            difficulty
        )
        values (
            new_puzzle_id,
            trim(category_data ->> 'name'),
            category_index + 1
        )
        returning id into new_category_id;

        for word_index in 0..3 loop
            word_value :=
                category_data -> 'words' -> word_index;

            if length(trim(word_value #>> '{}')) = 0 then
                raise exception 'Słowo nie może być puste.';
            end if;

            insert into public.words (
                category_id,
                value,
                position
            )
            values (
                new_category_id,
                trim(word_value #>> '{}'),
                word_index + 1
            );
        end loop;
    end loop;

    return new_puzzle_id;
end;
$$;

create or replace function public.create_puzzle(
    puzzle_title text,
    puzzle_publication_date date,
    puzzle_status text,
    puzzle_categories jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
begin
    return public.create_puzzle(
        puzzle_title,
        puzzle_publication_date,
        puzzle_status,
        puzzle_categories,
        null,
        null
    );
end;
$$;

revoke all on function public.create_puzzle(
    text,
    date,
    text,
    jsonb
) from public, anon, authenticated;

revoke all on function public.create_puzzle(
    text,
    date,
    text,
    jsonb,
    uuid,
    uuid
) from public, anon, authenticated;

grant execute on function public.create_puzzle(
    text,
    date,
    text,
    jsonb
) to service_role;

grant execute on function public.create_puzzle(
    text,
    date,
    text,
    jsonb,
    uuid,
    uuid
) to service_role;

create or replace function public.update_puzzle(
    target_puzzle_id bigint,
    puzzle_title text,
    puzzle_publication_date date,
    puzzle_status text,
    puzzle_categories jsonb,
    puzzle_last_edited_by_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    new_category_id bigint;
    category_data jsonb;
    word_value text;
    category_index integer;
    word_index integer;
begin
    if not exists (
        select 1
        from public.puzzles
        where id = target_puzzle_id
    ) then
        raise exception 'Plansza nie istnieje.';
    end if;

    if length(trim(puzzle_title)) = 0 then
        raise exception 'Tytuł planszy nie może być pusty.';
    end if;

    if puzzle_status not in ('draft', 'scheduled', 'archived') then
        raise exception 'Niepoprawny status planszy.';
    end if;

    if puzzle_status = 'scheduled'
       and puzzle_publication_date is null then
        raise exception 'Zaplanowana plansza musi mieć datę.';
    end if;

    if jsonb_array_length(puzzle_categories) <> 4 then
        raise exception 'Plansza musi zawierać cztery kategorie.';
    end if;

    update public.puzzles
    set
        title = trim(puzzle_title),
        publication_date = puzzle_publication_date,
        status = puzzle_status,
        last_edited_by_user_id = coalesce(puzzle_last_edited_by_user_id, last_edited_by_user_id),
        updated_at = now()
    where id = target_puzzle_id;

    delete from public.categories
    where puzzle_id = target_puzzle_id;

    for category_index in 0..3 loop
        category_data :=
            puzzle_categories -> category_index;

        if length(trim(category_data ->> 'name')) = 0 then
            raise exception 'Nazwa kategorii nie może być pusta.';
        end if;

        if jsonb_array_length(
            category_data -> 'words'
        ) <> 4 then
            raise exception 'Kategoria musi zawierać cztery słowa.';
        end if;

        insert into public.categories (
            puzzle_id,
            name,
            difficulty
        )
        values (
            target_puzzle_id,
            trim(category_data ->> 'name'),
            category_index + 1
        )
        returning id into new_category_id;

        for word_index in 0..3 loop
            word_value :=
                trim(
                    category_data
                        -> 'words'
                        ->> word_index
                );

            if length(word_value) = 0 then
                raise exception 'Słowo nie może być puste.';
            end if;

            insert into public.words (
                category_id,
                value,
                position
            )
            values (
                new_category_id,
                word_value,
                word_index + 1
            );
        end loop;
    end loop;
end;
$$;

create or replace function public.update_puzzle(
    target_puzzle_id bigint,
    puzzle_title text,
    puzzle_publication_date date,
    puzzle_status text,
    puzzle_categories jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.update_puzzle(
        target_puzzle_id,
        puzzle_title,
        puzzle_publication_date,
        puzzle_status,
        puzzle_categories,
        null
    );
end;
$$;

revoke all on function public.update_puzzle(
    bigint,
    text,
    date,
    text,
    jsonb
) from public, anon, authenticated;

revoke all on function public.update_puzzle(
    bigint,
    text,
    date,
    text,
    jsonb,
    uuid
) from public, anon, authenticated;

grant execute on function public.update_puzzle(
    bigint,
    text,
    date,
    text,
    jsonb
) to service_role;

grant execute on function public.update_puzzle(
    bigint,
    text,
    date,
    text,
    jsonb,
    uuid
) to service_role;
