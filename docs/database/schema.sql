create table if not exists public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  grupo_muscular text not null,
  patron_movimiento text,
  equipamiento text,
  dificultad text,
  descripcion text,
  created_at timestamptz default now(),
  instrucciones text,
  errores_comunes text,
  ajustes text,
  recomendaciones_nivel text,
  variantes text,
  contraindicaciones text,
  imagen_url text
);

create table if not exists public.perfiles (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  objetivo text not null,
  nivel text not null,
  dias_por_semana int4 not null,
  duracion_sesion int4 not null,
  equipo_disponible text,
  molestias text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

create table if not exists public.rutinas (
  id uuid primary key default gen_random_uuid(),
  objetivo text not null,
  nivel text not null,
  dias_por_semana int4 not null,
  created_at timestamptz default now(),
  indice_rotacion int4,
  user_id uuid references auth.users(id)
);

create table if not exists public.rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas(id) on delete cascade,
  dia int4 not null,
  titulo_dia text not null,
  nombre_ejercicio text not null,
  grupo_muscular text not null,
  series int4 not null,
  repeticiones text not null,
  created_at timestamptz default now(),
  ejercicio_id uuid references public.ejercicios(id)
);

create table if not exists public.sesiones_entrenamiento (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid references public.rutinas(id) on delete cascade,
  dia int4 not null,
  titulo_dia text not null,
  fecha date not null,
  created_at timestamptz default now(),
  nota_sesion text,
  user_id uuid references auth.users(id)
);

create table if not exists public.sesion_ejercicios (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones_entrenamiento(id) on delete cascade,
  nombre_ejercicio text not null,
  grupo_muscular text not null,
  series_planeadas int4 not null,
  repeticiones_planeadas text not null,
  completado boolean not null,
  created_at timestamptz default now(),
  series_reales int4,
  repeticiones_reales text,
  peso_usado numeric,
  sensacion text,
  ejercicio_id uuid references public.ejercicios(id),
  estado_resultado text,
  nivel_dolor int4,
  fatiga int4,
  descanso_recomendado int4,
  descanso_real int4,
  motivo_parcial text
);