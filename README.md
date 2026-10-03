# Mercury FrontEnd

Frontend del sistema "todo en uno" para franquicias de restaurantes: check-in, control de inventario y gestión de restaurante.

## Stack

- **Vue 3** (Composition API + `<script setup>`)
- **Vite** — bundler y dev server
- **Quasar** — componentes UI y layouts
- **Pinia** — manejo de estado
- **TypeScript** — tipado estricto
- **Axios** — cliente HTTP
- **Vitest** — pruebas unitarias
- **ESLint + Prettier** — calidad y formato
- **Husky + commitlint** — git hooks y conventional commits

## Requisitos previos

- Node.js `^20.19.0` o `>=22.12.0`
- npm

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env.local` y ajusta los valores:

```bash
cp .env.example .env.local
```

| Variable            | Descripción                 | Default                     |
| ------------------- | --------------------------- | --------------------------- |
| `VITE_API_BASE_URL` | URL base del backend (REST) | `http://localhost:8000/api` |
| `VITE_APP_TITLE`    | Título de la aplicación     | `TEC-FS`                    |

> El backend (FastAPI) corre en un repositorio separado.

## Scripts

```bash
npm run dev           # servidor de desarrollo (http://localhost:5173)
npm run build         # build de producción (vue-tsc + vite build)
npm run preview       # previsualizar el build de producción

npm run lint          # ESLint + auto-fix
npm run format        # Prettier sobre src/
npm run type-check    # vue-tsc sin emitir

npm run test          # Vitest (una vez)
npm run test:watch    # Vitest en modo watch
npm run test:coverage # Vitest con cobertura
```

## Estructura del proyecto

```
src/
  api/          # Definición de endpoints y cliente axios
  assets/       # Recursos estáticos (imágenes, fuentes)
  boot/         # Boot files de Quasar (plugins, configuración inicial)
  composables/  # Lógica reutilizable (use*)
  layouts/      # Layouts de Quasar (AuthLayout, MainLayout)
  pages/        # Vistas ruteadas
  router/       # Configuración de Vue Router y guards
  services/     # Lógica de negocio que orquesta llamadas de api/
  stores/       # Stores de Pinia
  types/        # Tipos e interfaces TypeScript compartidos
  utils/        # Funciones puras de utilidad
```

Reglas de capas:

- Las páginas/componentes consumen `services/` o `stores/`, nunca axios directo.
- `services/` orquesta y llama a `api/`.
- Todo lo que cruce una frontera (respuestas de API, props, payloads) se tipa en `types/`.

## Git

Este proyecto sigue **Git Flow** y **Conventional Commits**.

Ramas:

- `main` — producción
- `develop` — integración (todas las ramas de trabajo salen de aquí)
- `feature/<issue>-<descripcion>` — nuevas funcionalidades
- `fix/<issue>-<descripcion>` — correcciones sobre develop
- `hotfix/<descripcion>` — urgencias sobre main

Formato de commit: `<tipo>: <descripción en imperativo sin punto final>`

Tipos permitidos: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `perf`, `build`, `ci`, `revert`.

Ejemplo: `feat: agregar validación de credenciales en login`

El hook `pre-commit` corre lint-staged (ESLint + Prettier) y `type-check` automáticamente. El hook `commit-msg` valida el formato conventional.

## Contenedor todo en uno

Una sola imagen con el sistema completo: frontend, API, PostgreSQL y MinIO. Todos los datos viven en el volumen `/data`. La publican los releases de este repo y de `mercurio-backend`.

```bash
docker login ghcr.io          # los paquetes son privados: token con read:packages
docker run -d --name woowkids -p 8080:80 -v woowkids_data:/data ghcr.io/sistemasiq/woowkids:latest
```

Abre http://localhost:8080 y entra con `admin@woowkids.com` / `admin1234`. La consola de MinIO es opcional: agrega `-p 9001:9001`.

Los valores por defecto son genéricos. Cámbialos con `-e`:

- `POSTGRES_PASSWORD`, `SECRET_KEY`, `MINIO_SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`;
- `COOKIE_SECURE=true` si va detrás de HTTPS;
- `CORS_ORIGINS` con la URL pública;
- `SEED_DEMO=true` para cargar datos de prueba la primera vez.

Tags: `latest` y `f<frontend>-b<backend>` (por ejemplo `f1.0.0-b1.0.0`). Para producción a escala usa las imágenes separadas con `docker-compose.yml`.
