create or replace function public.delete_scheduled_crossword(
    target_puzzle_id bigint
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
                where id = target_puzzle_id
                    and game_type = 'crossword'
    ) then
                raise exception 'Krzyżówka nie istnieje.';
    end if;

    delete from public.puzzles
    where id = target_puzzle_id;
end;
$$;

revoke all on function public.delete_scheduled_crossword(bigint)
from public, anon, authenticated;

grant execute on function public.delete_scheduled_crossword(bigint)
to service_role;