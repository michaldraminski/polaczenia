delete from public.game_results;

alter table public.game_results
drop constraint game_results_attempts_valid;

alter table public.game_results
rename column attempts to mistakes;

alter table public.game_results
add constraint game_results_mistakes_valid
check (mistakes between 0 and 4);

drop function public.record_game_result(
    bigint,
    text,
    text,
    smallint,
    integer
);

create function public.record_game_result(
    result_puzzle_id bigint,
    result_client_game_id text,
    result_status text,
    result_mistakes smallint,
    result_duration_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not exists (
        select 1
        from public.puzzles
        where id = result_puzzle_id
          and (
              status = 'archived'
              or (
                  status = 'scheduled'
                  and publication_date <= current_date
              )
          )
    ) then
        raise exception 'Plansza nie jest publicznie dostępna.';
    end if;

    insert into public.game_results (
        puzzle_id,
        client_game_id,
        result,
        mistakes,
        duration_seconds
    )
    values (
        result_puzzle_id,
        trim(result_client_game_id),
        result_status,
        result_mistakes,
        result_duration_seconds
    )
    on conflict (
        puzzle_id,
        client_game_id
    ) do nothing;
end;
$$;

revoke all on function public.record_game_result(
    bigint,
    text,
    text,
    smallint,
    integer
)
from public, anon, authenticated;

grant execute on function public.record_game_result(
    bigint,
    text,
    text,
    smallint,
    integer
)
to service_role;