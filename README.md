# FitAdapt — Generador y seguimiento de rutinas personalizadas

Aplicación web desarrollada como Trabajo de Fin de Grado para la gestión, personalización, seguimiento y validación de rutinas de entrenamiento.

FitAdapt permite crear un perfil de entrenamiento, generar una rutina adaptada al objetivo, nivel, disponibilidad, equipamiento y molestias del usuario, registrar sesiones reales, analizar el progreso y revisar la técnica de ejercicios mediante visión artificial.

# URL pública para acceder desde navegador 

https://fit-adapt-five.vercel.app/login

Para acceder hace falta registrarse y confirmar el correo, se suele recibir en el apartado de SPAM para poder confirmar. 

## Tecnologías utilizadas

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Auth
- PostgreSQL
- TensorFlow.js
- MoveNet
- Recharts
- ESLint

## Funcionalidades principales

- Registro e inicio de sesión de usuarios.
- Confirmación de correo electrónico durante el registro.
- Recuperación y actualización de contraseña.
- Configuración inicial del perfil mediante onboarding.
- Edición posterior del perfil de entrenamiento.
- Generación de rutinas personalizadas según objetivo, nivel, disponibilidad, duración, equipamiento y molestias.
- Detección de rutinas desactualizadas cuando cambia el perfil del usuario.
- Aviso visual cuando una rutina generada todavía no ha sido guardada.
- Guardado y actualización de rutinas.
- Rotación de ejercicios para evitar planes repetitivos.
- Sustitución de ejercicios por alternativas compatibles.
- Modificación de rutinas mediante lenguaje natural.
- Catálogo de ejercicios con fichas técnicas.
- Registro de sesiones de entrenamiento.
- Registro de series reales, repeticiones reales, peso usado, sensación, dolor, fatiga y descanso.
- Temporizador de descanso recomendado.
- Historial por ejercicio.
- Panel de progreso global.
- Resumen por grupo muscular.
- Resumen por ejercicio.
- Diagnóstico automático del progreso.
- Validación técnica aproximada mediante vídeo usando TensorFlow.js y MoveNet.

## Estructura principal del proyecto

txt src/ ├── app/ │   ├── actualizar-password/ │   ├── auth/ │   │   └── callback/ │   ├── ejercicios/ │   ├── entrenamiento/ │   ├── inicio/ │   ├── login/ │   ├── onboarding/ │   ├── perfil/ │   ├── progreso/ │   ├── recuperar-password/ │   ├── rutina/ │   └── validacion/ ├── componentes/ ├── lib/ │   ├── auth/ │   ├── dominio/ │   ├── ejercicios/ │   ├── entrenamiento/ │   ├── perfil/ │   ├── progreso/ │   ├── rutina/ │   ├── shared/ │   ├── supabase/ │   ├── ui/ │   └── validacion/ └── tipos/ 

## Requisitos previos

Para ejecutar el proyecto es necesario tener instalado:

- Node.js 22.x
- npm 10.x
- Una cuenta o proyecto en Supabase

## Instalación

Instalar las dependencias:

bash npm install 

Crear un archivo .env.local en la raíz del proyecto con las variables necesarias:

env NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase NEXT_PUBLIC_SITE_URL=http://localhost:3000 

Ejecutar el servidor de desarrollo:

bash npm run dev 

La aplicación estará disponible normalmente en:

txt http://localhost:3000 

## Configuración de Supabase Auth

En Supabase, dentro de Authentication > URL Configuration, se debe configurar:

txt Site URL: http://localhost:3000 

Y añadir como URLs permitidas:

txt http://localhost:3000/auth/callback http://localhost:3000/actualizar-password http://localhost:3000/inicio 

Para producción, estas URLs deben cambiarse al dominio final de despliegue.

Ejemplo:

txt https://tu-dominio.com/auth/callback https://tu-dominio.com/actualizar-password https://tu-dominio.com/inicio 

La variable NEXT_PUBLIC_SITE_URL debe coincidir con el dominio usado por la aplicación.

## Configuración de correo

Supabase Auth envía correos para:

- Confirmación de registro.
- Recuperación de contraseña.

Durante el desarrollo puede usarse el sistema de correo integrado de Supabase, aunque tiene límites bajos de envío. Para pruebas más amplias o despliegue final, se recomienda configurar SMTP propio desde Authentication > Emails > SMTP Settings.

## Comandos disponibles

Iniciar el entorno de desarrollo:

bash npm run dev 

Ejecutar ESLint:

bash npm run lint 

Compilar la aplicación:

bash npm run build 

Ejecutar comprobación completa:

bash npm run check 

## Base de datos

El proyecto utiliza Supabase con PostgreSQL.

Las tablas principales son:

- ejercicios: catálogo de ejercicios disponibles en la aplicación.
- perfiles: configuración personalizada de cada usuario.
- rutinas: rutinas guardadas por cada usuario.
- rutina_ejercicios: ejercicios asociados a cada rutina.
- sesiones_entrenamiento: sesiones reales registradas por el usuario.
- sesion_ejercicios: datos reales de cada ejercicio realizado en una sesión.

La documentación de base de datos se encuentra en:

txt docs/database/ 

Archivos incluidos:

txt schema.sql rls-policies.sql README.md 

## Seguridad y privacidad

La aplicación utiliza Supabase Auth para gestionar registro, inicio de sesión, confirmación de correo, recuperación de contraseña y cierre de sesión.

La base de datos utiliza Row Level Security en las tablas principales. Las políticas RLS limitan el acceso mediante auth.uid(), de forma que cada usuario solo puede consultar, insertar, actualizar o eliminar sus propios perfiles, rutinas y sesiones de entrenamiento.

El catálogo de ejercicios se considera información pública interna de la aplicación y puede consultarse por usuarios autenticados.

Los datos personales de entrenamiento, progreso y configuración quedan asociados al usuario autenticado.

## Validación técnica por vídeo

La aplicación incluye un módulo de validación técnica aproximada mediante vídeo.

Aunque la propuesta inicial contemplaba PoseNet como ejemplo de modelo de estimación de postura, la implementación utiliza MoveNet mediante TensorFlow.js por su integración directa en navegador y su rendimiento para la detección de una persona.

El análisis se realiza en el cliente y evalúa puntos corporales detectados en varios frames del vídeo. El resultado sirve como orientación técnica y no sustituye la valoración de un profesional.

## Validación final

La versión final se ha comprobado con:

```bash
npm run lint
npm run build
npm audit
```

Resultado:

- ESLint finaliza sin errores.
- La compilación de producción se completa correctamente con Next.js 16.2.7.
- La aplicación genera correctamente las rutas principales, incluyendo autenticación, perfil, rutina, entrenamiento, progreso, ejercicios y validación técnica.
- La auditoría de dependencias no muestra vulnerabilidades críticas ni altas.
- Permanece un aviso moderado asociado a `postcss`, dependencia transitiva incluida internamente por Next.js. No se aplica `npm audit fix --force` porque propone instalar `next@9.3.3`, una versión incompatible con el proyecto actual.
```