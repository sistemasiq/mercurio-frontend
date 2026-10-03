# Setup de calidad + git hooks — Mercury FrontEnd

Pasos para dejar funcionando ESLint + Prettier + Vitest + Husky + commitlint.

## 1. Copiar archivos a la raíz del repo

```
eslint.config.js
.prettierrc.json
.prettierignore
vitest.config.ts
vitest.setup.ts
commitlint.config.js
.lintstagedrc.json
```

Los dos hooks van dentro de `.husky/` (ver paso 4):

```
husky/pre-commit   -> .husky/pre-commit
husky/commit-msg   -> .husky/commit-msg
```

## 2. Instalar dependencias

```bash
# ESLint + Prettier (Vue 3 + TS)
npm i -D eslint @eslint/js eslint-plugin-vue \
  @vue/eslint-config-typescript @vue/eslint-config-prettier \
  prettier vue-tsc

# Vitest + testing
npm i -D vitest @vue/test-utils jsdom @vitest/coverage-v8

# Husky + commitlint + lint-staged
npm i -D husky lint-staged \
  @commitlint/cli @commitlint/config-conventional
```

## 3. Scripts en package.json

Agrega dentro de `"scripts"`:

```json
{
  "scripts": {
    "lint": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,vue,json,scss,sass}\"",
    "type-check": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky"
  }
}
```

## 4. Inicializar Husky

```bash
npm run prepare          # crea la carpeta .husky/
```

Luego copia los dos hooks a `.husky/` y dales permiso de ejecución:

```bash
cp husky/pre-commit .husky/pre-commit
cp husky/commit-msg .husky/commit-msg
chmod +x .husky/pre-commit .husky/commit-msg
```

> Nota: con Husky v9+ los hooks son scripts shell planos (sin la cabecera vieja de `husky.sh`). Los archivos provistos ya están en ese formato.

## 5. Probar

```bash
# Debe fallar (tipo inválido):
git commit -m "agrega login"

# Debe pasar:
git commit -m "feat: agregar validacion de credenciales en login"
```

Al commitear, el `pre-commit` corre lint-staged (eslint+prettier sobre lo staged) y `type-check`; si algo falla, el commit se aborta. El `commit-msg` valida el formato conventional.

## Qué hace cada cosa

- **eslint.config.js** — Reglas Vue/TS: componentes en PascalCase multi-palabra, fuerza `<script setup>`, advierte sobre `any`, prohíbe `debugger`.
- **.prettierrc.json** — Formato: sin punto y coma, comillas simples, ancho 100, comas finales.
- **vitest.config.ts / vitest.setup.ts** — Tests con jsdom; Quasar y Pinia preinstalados en cada test.
- **commitlint.config.js** — Conventional commits, todos los tipos, sin scope, subject en minúscula sin punto final.
- **.lintstagedrc.json** — Corre las herramientas solo sobre archivos staged (rápido).
- **.husky/** — pre-commit (calidad) y commit-msg (formato).
