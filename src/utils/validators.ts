//Solo permite teclear numeros y bloquea todo lo demas en eventos keydown
export function allowOnlyNumbersKeydown(e: KeyboardEvent) {
  const controlKeys = [
    'Backspace',
    'Delete',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Tab',
    'Enter',
  ]
  if (controlKeys.includes(e.key)) {
    return
  }

  if (e.ctrlKey || e.metaKey) {
    return
  }

  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault()
  }
}

//Permite solo el uso de letras en eventos keydown
export function allowOnlyLettersKeydown(e: KeyboardEvent) {
  const controlKeys = [
    'Backspace',
    'Delete',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Tab',
    'Enter',
  ]

  if (controlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
    return
  }

  const isLetterOrSpace = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]$/.test(e.key)

  if (!isLetterOrSpace) {
    e.preventDefault()
  }
}
