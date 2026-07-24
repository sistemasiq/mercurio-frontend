// Timbre de alerta corto (dos tonos) generado con Web Audio — no depende de
// ningún archivo de audio. Se usa para avisar eventos que requieren atención
// inmediata (ej. un insumo que cruza su stock mínimo) aunque el usuario no
// esté mirando la pantalla en ese momento.
export function playAlertChime(): void {
  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return

    const ctx = new AudioContextCtor()
    const now = ctx.currentTime
    const frecuencias = [880, 1108.73]

    frecuencias.forEach((frecuencia, i) => {
      const oscilador = ctx.createOscillator()
      const ganancia = ctx.createGain()
      const inicio = now + i * 0.15

      oscilador.type = 'sine'
      oscilador.frequency.value = frecuencia
      ganancia.gain.setValueAtTime(0, inicio)
      ganancia.gain.linearRampToValueAtTime(0.2, inicio + 0.02)
      ganancia.gain.exponentialRampToValueAtTime(0.001, inicio + 0.35)

      oscilador.connect(ganancia)
      ganancia.connect(ctx.destination)
      oscilador.start(inicio)
      oscilador.stop(inicio + 0.4)
    })

    setTimeout(() => void ctx.close(), 1000)
  } catch {
    // Web Audio no disponible en este entorno (ej. tests) — la alerta visual
    // (q-notify) sigue mostrándose de todas formas.
  }
}
