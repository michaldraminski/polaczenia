create function public.create_puzzle(
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
        status
    )
    values (
        trim(puzzle_title),
        puzzle_publication_date,
        puzzle_status
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

revoke all on function public.create_puzzle(
    text,
    date,
    text,
    jsonb
) from public, anon, authenticated;

grant execute on function public.create_puzzle(
    text,
    date,
    text,
    jsonb
) to service_role;