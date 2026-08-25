create table if not exists public.game_results (
    id bigint generated always as identity primary key,
    puzzle_id bigint not null references public.puzzles(id) on delete cascade,
    client_game_id text not null,
    result text not null,
    attempts smallint not null,
    duration_seconds integer not null,
    created_at timestamptz not null default now(),

    constraint game_results_client_game_id_not_empty
        check (length(trim(client_game_id)) > 0),
    constraint game_results_result_valid
        check (result in ('won', 'lost')),
    constraint game_results_attempts_valid
        check (attempts between 1 and 4),
    constraint game_results_duration_valid
        check (duration_seconds between 0 and 86400),
    constraint game_results_unique_client_game
        unique (puzzle_id, client_game_id)
);

create index if not exists game_results_puzzle_id_index
    on public.game_results(puzzle_id);

create or replace function public.record_game_result(
    result_puzzle_id bigint,
    result_client_game_id text,
    result_status text,
    result_attempts smallint,
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
        attempts,
        duration_seconds
    )
    values (
        result_puzzle_id,
        trim(result_client_game_id),
        result_status,
        result_attempts,
        result_duration_seconds
    )
    on conflict (puzzle_id, client_game_id) do nothing;
end;
$$;

revoke all on function public.record_game_result(bigint, text, text, smallint, integer)
from public, anon, authenticated;

grant execute on function public.record_game_result(bigint, text, text, smallint, integer)
to service_role;