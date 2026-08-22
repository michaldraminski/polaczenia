create function public.delete_puzzle(
    target_puzzle_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    target_status text;
begin
    select status
    into target_status
    from public.puzzles
    where id = target_puzzle_id;

    if target_status is null then
        raise exception 'Plansza nie istnieje.';
    end if;

    if target_status = 'scheduled' then
        raise exception 'Nie można usunąć zaplanowanej planszy.';
    end if;

    delete from public.puzzles
    where id = target_puzzle_id;
end;
$$;

revoke all on function public.delete_puzzle(bigint)
from public, anon, authenticated;

grant execute on function public.delete_puzzle(bigint)
to service_role;