export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos (todos)
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'refactor', 'docs', 'style', 'test', 'perf', 'build', 'ci', 'revert'],
    ],
    // Sin scope (no usamos scopes en este proyecto)
    'scope-empty': [2, 'always'],
    // Descripción obligatoria, minúscula, sin punto final
    'subject-empty': [2, 'never'],
    'subject-case': [2, 'always', ['lower-case']],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
}
