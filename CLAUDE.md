# CLAUDE.md — Mercury FrontEnd

Contexto y reglas para trabajar en este repositorio. Léelo completo antes de empezar cualquier tarea.

## Proyecto

Sistema "todo en uno" para franquicias de restaurantes: check-in, control de inventario y control de restaurante. Aplicación pesada y multi-módulo.

- **Este repo es solo el frontend.** El backend (FastAPI) vive en un repositorio separado. No tienes acceso a él; cuando necesites datos del servidor, asume contratos REST y consúmelos vía la capa de `services`/`api`.
- **Stack:** Vue 3 (Composition API + `<script setup>`) · Vite · Quasar · Pinia · TypeScript · Axios.

## Arquitectura

Organización **por tipo** (la estructura ya existe, respétala):

```
src/
  api/          # Definición de llamadas HTTP (endpoints), instancia de axios
  assets/
  boot/         # Boot files de Quasar (axios, pinia, etc.)
  composables/  # Lógica reutilizable (use*)
  layouts/      # Layouts de Quasar
  pages/        # Vistas/páginas (ruteadas)
  router/       # Configuración de Vue Router
  services/     # Lógica de negocio que orquesta llamadas de api/
  stores/       # Stores de Pinia
  types/        # Tipos e interfaces TypeScript compartidos
  utils/        # Funciones puras de utilidad
```

Reglas de capas:
- Los **componentes/pages** no llaman a axios directo. Consumen `services/` (o `stores/` cuando hay estado).
- `services/` orquesta y llama a `api/`. `api/` solo arma la request y la dispara.
- Tipa todo lo que cruce una frontera (respuestas de API, props, payloads) usando `types/`.
- Estado: **solo Pinia** por ahora. No introducir otras librerías de estado sin pedir confirmación.

## Convenciones de código

- **Componentes Vue:** PascalCase multi-palabra (`CheckinForm.vue`, `InventoryTable.vue`). Siempre `<script setup lang="ts">`.
- **Archivos no-componente (ts):** camelCase (`useInventory.ts`, `authService.ts`, `dateUtils.ts`).
- **Variables, funciones, métodos:** camelCase.
- **Tipos / interfaces / enums:** PascalCase.
- **Constantes globales:** UPPER_SNAKE_CASE.
- Composition API exclusivamente. Nada de Options API.
- TypeScript estricto: evita `any`; usa tipos explícitos en límites de funciones públicas.

## Git — MUY IMPORTANTE

### Push: PROHIBIDO
- **NUNCA hagas `git push`.** Bajo ninguna circunstancia, a ninguna rama, y especialmente nunca a `main`.
- Todos los push los hace el usuario manualmente. Tu trabajo termina en el commit local.

### Git Flow
- `main`: producción. No se toca directamente.
- `develop`: rama de integración. **Todas las ramas de trabajo salen de `develop`.**
- Ramas de trabajo:
    - `feature/<issue>-<descripcion-corta>` para nuevas funcionalidades.
    - `fix/<issue>-<descripcion-corta>` o `bugfix/...` para correcciones sobre develop.
    - `hotfix/<descripcion>` solo para urgencias sobre `main` (pedir confirmación antes).
    - `release/<version>` para preparar releases.
- `<issue>` es el número de GitHub Issue (ej. `feature/2-registro-entrada`).
- Antes de crear una rama, asegúrate de partir de `develop` actualizado.

### Commits — Conventional Commits
- Formato: `<tipo>: <descripción en imperativo>`.
- **Todos los tipos permitidos:** `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `perf`, `build`, `ci`, `revert`.
- **Sin scopes** (no usar `feat(checkin):`, solo `feat:`).
- Descripción en minúscula, en imperativo, sin punto final. Ej: `feat: agregar validación de credenciales en login`.
- Si el commit cierra o se relaciona con un issue, referencialo en el cuerpo: `Refs #1` o `Closes #1`.
- **Haz commits frecuentes y atómicos:** un commit por unidad lógica de trabajo terminada. No acumules muchos cambios no relacionados en un solo commit. Cada vez que completes algo coherente, haz commit.
- Elige el tipo según lo que realmente hizo el commit (no marques todo como `feat`).

## Calidad — correr antes de cada commit

Antes de hacer cualquier commit, ejecuta y asegúrate de que pasen:
1. `lint` (ESLint + Prettier)
2. `type-check` (`vue-tsc`)
3. `test` (Vitest), si hay tests que apliquen al cambio

**Si algo falla, NO hagas commit.** Arregla primero, luego commitea. Si no puedes arreglarlo, detente y avísame.

> Nota: estas herramientas (ESLint, Prettier, vue-tsc, Vitest) aún no están todas configuradas en el repo. Si una no existe todavía, avísame en lugar de inventar el comando.

## Flujo de trabajo esperado

1. Para tareas no triviales, primero **explica tu plan** y espera mi visto bueno antes de escribir código.
2. Trabaja una tarea a la vez, enfocado.
3. Crea la rama correcta desde `develop` antes de empezar.
4. Implementa en incrementos pequeños y revisables.
5. Corre lint/type-check/test → commit (conventional) → repite según avances.
6. **Nunca pushees.** Al terminar, dime qué ramas y commits dejaste listos para que yo los suba.