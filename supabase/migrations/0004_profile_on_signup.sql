-- Crear el perfil al registrarse.
--
-- El esquema inicial daba por hecho que la fila de `profiles` aparecía sola. No
-- aparece: `auth.users` la crea Supabase y nadie escribe en `profiles`. Sin este
-- trigger, todo usuario recién registrado se queda sin perfil, y como el feed
-- hace join contra `profiles` para pintar el autor, sus publicaciones no se ven.
--
-- Va como trigger y no como llamada desde la app por el mismo motivo que el gate
-- de KYC: la app no es el único cliente. Un usuario creado desde el panel de
-- Supabase también tiene que acabar con perfil.

-- Un handle provisional, único y válido para el check de `profiles.handle`.
-- El usuario lo cambia luego; lo que no puede es quedarse sin uno.
create or replace function public.build_initial_handle(user_email text, user_id uuid)
returns text
language plpgsql
stable
as $$
declare
  base text;
  suffix text := substr(replace(user_id::text, '-', ''), 1, 6);
begin
  -- Parte local del correo, saneada al alfabeto que admite el check del handle.
  base := lower(split_part(coalesce(user_email, ''), '@', 1));
  base := regexp_replace(base, '[^a-z0-9_]', '', 'g');

  -- Demasiado corto o vacío: se descarta y se usa solo el sufijo.
  if char_length(base) < 3 then
    return 'bh_' || suffix;
  end if;

  -- El check limita a 30 caracteres, y hay que dejar sitio al sufijo.
  return substr(base, 1, 23) || '_' || suffix;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    public.build_initial_handle(new.email, new.id),
    -- Si el proveedor no da nombre, el handle hace de nombre visible hasta que
    -- el usuario complete su perfil.
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      public.build_initial_handle(new.email, new.id)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Y la fila de verificación, en 'none': así el gate de cobro tiene siempre algo
-- que consultar en vez de depender de que la fila exista.
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.creator_verifications (profile_id, status)
  values (new.id, 'none')
  on conflict (profile_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();
