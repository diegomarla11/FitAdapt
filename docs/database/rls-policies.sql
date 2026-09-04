alter table public.perfiles enable row level security;
alter table public.rutinas enable row level security;
alter table public.rutina_ejercicios enable row level security;
alter table public.sesiones_entrenamiento enable row level security;
alter table public.sesion_ejercicios enable row level security;

-- La tabla ejercicios puede ser pública en lectura porque actúa como catálogo.
alter table public.ejercicios enable row level security;

create policy "Usuarios pueden leer ejercicios"
on public.ejercicios
for select
to authenticated
using (true);

create policy "Usuarios pueden leer sus perfiles"
on public.perfiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus perfiles"
on public.perfiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus perfiles"
on public.perfiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuarios pueden leer sus rutinas"
on public.rutinas
for select
to authenticated
using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus rutinas"
on public.rutinas
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus rutinas"
on public.rutinas
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuarios pueden borrar sus rutinas"
on public.rutinas
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Usuarios pueden leer ejercicios de sus rutinas"
on public.rutina_ejercicios
for select
to authenticated
using (
  exists (
    select 1
    from public.rutinas r
    where r.id = rutina_ejercicios.rutina_id
    and r.user_id = auth.uid()
  )
);

create policy "Usuarios pueden crear ejercicios en sus rutinas"
on public.rutina_ejercicios
for insert
to authenticated
with check (
  exists (
    select 1
    from public.rutinas r
    where r.id = rutina_ejercicios.rutina_id
    and r.user_id = auth.uid()
  )
);

create policy "Usuarios pueden borrar ejercicios de sus rutinas"
on public.rutina_ejercicios
for delete
to authenticated
using (
  exists (
    select 1
    from public.rutinas r
    where r.id = rutina_ejercicios.rutina_id
    and r.user_id = auth.uid()
  )
);

create policy "Usuarios pueden leer sus sesiones"
on public.sesiones_entrenamiento
for select
to authenticated
using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus sesiones"
on public.sesiones_entrenamiento
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Usuarios pueden leer ejercicios de sus sesiones"
on public.sesion_ejercicios
for select
to authenticated
using (
  exists (
    select 1
    from public.sesiones_entrenamiento s
    where s.id = sesion_ejercicios.sesion_id
    and s.user_id = auth.uid()
  )
);

create policy "Usuarios pueden crear ejercicios de sus sesiones"
on public.sesion_ejercicios
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sesiones_entrenamiento s
    where s.id = sesion_ejercicios.sesion_id
    and s.user_id = auth.uid()
  )
);

create policy "Usuarios pueden actualizar sus sesiones"
on public.sesiones_entrenamiento
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuarios pueden borrar ejercicios de sus sesiones"
on public.sesion_ejercicios
for delete
to authenticated
using (
  exists (
    select 1
    from public.sesiones_entrenamiento s
    where s.id = sesion_ejercicios.sesion_id
    and s.user_id = auth.uid()
  )
);