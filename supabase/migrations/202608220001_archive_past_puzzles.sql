create or replace function public.archive_past_puzzles(
    current_date_in_poland date
)
returns void
language sql
security definer
set search_path = public
as $$
    update public.puzzles
    set
        status = 'archived',
        updated_at = now()
    where status = 'scheduled'
      and publication_date < current_date_in_poland;
$$;

revoke all on function public.archive_past_puzzles(date)
from public, anon, authenticated;

grant execute on function public.archive_past_puzzles(date)
to service_role;