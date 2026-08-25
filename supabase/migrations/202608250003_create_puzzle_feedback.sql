create table if not exists public.puzzle_feedback (
    id bigint generated always as identity primary key,
    puzzle_id bigint not null references public.puzzles(id) on delete cascade,
    client_game_id text not null,
    difficulty_rating smallint not null,
    quality_rating smallint not null,
    created_at timestamptz not null default now(),

    constraint puzzle_feedback_client_game_id_not_empty
        check (length(trim(client_game_id)) > 0),
    constraint puzzle_feedback_difficulty_valid
        check (difficulty_rating between 1 and 5),
    constraint puzzle_feedback_quality_valid
        check (quality_rating between 1 and 5),
    constraint puzzle_feedback_unique_client_game
        unique (puzzle_id, client_game_id)
);

create index if not exists puzzle_feedback_puzzle_id_index
    on public.puzzle_feedback(puzzle_id);

create or replace function public.record_puzzle_feedback(
    feedback_puzzle_id bigint,
    feedback_client_game_id text,
    feedback_difficulty_rating smallint,
    feedback_quality_rating smallint
)
returns void
language sql
security definer
set search_path = public
as $$
    insert into public.puzzle_feedback (
        puzzle_id,
        client_game_id,
        difficulty_rating,
        quality_rating
    )
    select
        feedback_puzzle_id,
        trim(feedback_client_game_id),
        feedback_difficulty_rating,
        feedback_quality_rating
    where exists (
        select 1
        from public.game_results
        where puzzle_id = feedback_puzzle_id
          and client_game_id = feedback_client_game_id
          and result = 'won'
    )
    on conflict (puzzle_id, client_game_id) do nothing;
$$;

revoke all on function public.record_puzzle_feedback(bigint, text, smallint, smallint)
from public, anon, authenticated;

grant execute on function public.record_puzzle_feedback(bigint, text, smallint, smallint)
to service_role;