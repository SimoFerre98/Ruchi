create or replace function public.join_event_by_code(_invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  _event_id uuid;
  _user_id uuid;
begin
  _user_id := auth.uid();
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Find event
  select id into _event_id
  from public.events
  where invite_code = _invite_code
  limit 1;

  if _event_id is null then
    raise exception 'Invalid invite code';
  end if;

  -- Check if already participant
  if exists (select 1 from public.participants where event_id = _event_id and user_id = _user_id) then
    raise exception 'Already a participant';
  end if;

  -- Insert participant
  insert into public.participants (event_id, user_id)
  values (_event_id, _user_id);

  return _event_id;
end;
$$;
