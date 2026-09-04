# Base de datos Supabase

La aplicación utiliza Supabase como backend para autenticación, base de datos PostgreSQL y persistencia de rutinas, perfiles, sesiones y ejercicios.

## Tablas principales

### `ejercicios`

Catálogo de ejercicios disponibles para generar rutinas, mostrar fichas técnicas y proponer sustituciones.

Columnas principales:

- `id`: identificador del ejercicio.
- `nombre`: nombre del ejercicio.
- `grupo_muscular`: grupo muscular principal.
- `patron_movimiento`: patrón de movimiento.
- `equipamiento`: material necesario.
- `dificultad`: nivel recomendado.
- `descripcion`: descripción general.
- `instrucciones`: ejecución técnica.
- `errores_comunes`: fallos habituales.
- `ajustes`: colocación y ajustes técnicos.
- `recomendaciones_nivel`: recomendaciones según experiencia.
- `variantes`: variantes posibles.
- `contraindicaciones`: casos en los que evitar el ejercicio.
- `imagen_url`: imagen asociada.

### `perfiles`

Guarda la configuración del usuario para generar rutinas personalizadas.

Columnas principales:

- `id`
- `nombre`
- `objetivo`
- `nivel`
- `dias_por_semana`
- `duracion_sesion`
- `equipo_disponible`
- `molestias`
- `created_at`
- `updated_at`
- `user_id`

### `rutinas`

Guarda las rutinas generadas o editadas por cada usuario.

Columnas principales:

- `id`
- `objetivo`
- `nivel`
- `dias_por_semana`
- `created_at`
- `indice_rotacion`
- `user_id`

### `rutina_ejercicios`

Relaciona una rutina con sus ejercicios, días y parámetros planificados.

Columnas principales:

- `id`
- `rutina_id`
- `dia`
- `titulo_dia`
- `nombre_ejercicio`
- `grupo_muscular`
- `series`
- `repeticiones`
- `created_at`
- `ejercicio_id`

### `sesiones_entrenamiento`

Guarda cada sesión realizada por el usuario.

Columnas principales:

- `id`
- `rutina_id`
- `dia`
- `titulo_dia`
- `fecha`
- `created_at`
- `nota_sesion`
- `user_id`

### `sesion_ejercicios`

Guarda el resultado real de cada ejercicio dentro de una sesión.

Columnas principales:

- `id`
- `sesion_id`
- `nombre_ejercicio`
- `grupo_muscular`
- `series_planeadas`
- `repeticiones_planeadas`
- `completado`
- `created_at`
- `series_reales`
- `repeticiones_reales`
- `peso_usado`
- `sensacion`
- `ejercicio_id`
- `estado_resultado`
- `nivel_dolor`
- `fatiga`
- `descanso_recomendado`
- `descanso_real`
- `motivo_parcial`

## Relaciones principales

- `perfiles.user_id` referencia al usuario autenticado.
- `rutinas.user_id` referencia al usuario autenticado.
- `rutina_ejercicios.rutina_id` referencia a `rutinas.id`.
- `rutina_ejercicios.ejercicio_id` referencia a `ejercicios.id`.
- `sesiones_entrenamiento.rutina_id` referencia a `rutinas.id`.
- `sesiones_entrenamiento.user_id` referencia al usuario autenticado.
- `sesion_ejercicios.sesion_id` referencia a `sesiones_entrenamiento.id`.
- `sesion_ejercicios.ejercicio_id` referencia a `ejercicios.id`.

## Seguridad

La base de datos utiliza Row Level Security para limitar el acceso a los datos del usuario autenticado.

Las tablas con datos propios de usuario deben filtrar por `user_id` o por relaciones con rutinas/sesiones pertenecientes al usuario.

## Importación

Para reconstruir la base de datos:

1. Crear un nuevo proyecto en Supabase.
2. Ejecutar el contenido de `schema.sql` en el SQL Editor.
3. Ejecutar el contenido de `rls-policies.sql`.
4. Insertar ejercicios iniciales en la tabla `ejercicios`.
5. Configurar las variables de entorno en `.env.local`.