-- 1. Funzione sicura per controllare l'accesso (evita il loop infinito)
create or replace function public.is_event_member(_event_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.participants
    where event_id = _event_id
    and user_id = auth.uid()
  );
end;
$$;

-- 2. Rimuovi le policy che causano il problema
drop policy if exists "View participants" on public.participants;
drop policy if exists "View events" on public.events;

-- 3. Ricrea le policy usando la funzione sicura
create policy "View participants" on public.participants for select using (
  public.is_event_member(event_id) or 
  exists (select 1 from public.events where id = event_id and created_by = auth.uid())
);

create policy "View events" on public.events for select using (
  auth.uid() = created_by or 
  public.is_event_member(id)
);
