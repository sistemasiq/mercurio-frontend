export type TicketWidth = 58 | 80 | 210

export function ticketContentWidth(width: TicketWidth): string {
  return `${width === 210 ? 190 : width}mm`
}

const excluded = '.print-hide, [data-no-print], button, script, iframe, object, embed'

function fontRules(doc: Document): string {
  const result: string[] = []
  function visit(rules: CSSRuleList, base: string) {
    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.FONT_FACE_RULE) {
        result.push(
          rule.cssText.replace(
            /url\(["']?([^"')]+)["']?\)/g,
            (_, url: string) => `url("${new URL(url, base).href}")`,
          ),
        )
      } else if ('cssRules' in rule) {
        visit((rule as CSSGroupingRule).cssRules, base)
      }
    }
  }
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      visit(sheet.cssRules, sheet.href || doc.baseURI)
    } catch {
      // Cross-origin sheets are not readable; their computed styles are copied below.
    }
  }
  return result.join('\n')
}

/** Snapshot rendered DOM and inherited styles without importing global print CSS. */
export function createTicketDocument(
  element: HTMLElement,
  width: TicketWidth | null = null,
): Document {
  const source = element.ownerDocument
  const view = source.defaultView
  if (!view || !element.isConnected) throw new Error('El comprobante no está disponible.')
  const doc = source.implementation.createHTMLDocument('Comprobante')
  doc.documentElement.lang = 'es-MX'
  const base = doc.createElement('base')
  base.href = source.baseURI
  doc.head.append(base)
  const styles = doc.createElement('style')
  styles.textContent = `${fontRules(source)}
    @page { size: ${width === null ? 'auto' : width === 210 ? 'A4' : `${width}mm 297mm`}; margin: ${width === 210 ? '10mm' : '0'}; }
    html, body { margin: 0; padding: 0; background: white; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; animation: none !important; transition: none !important; }
    [data-print-root] { width: ${ticketContentWidth(width ?? 80)} !important; max-width: none !important;
      height: auto !important; max-height: none !important; margin: 0 !important; overflow: visible !important; }
    [data-print-root] * { overflow: visible !important; }
    .ticket-row, .ticket-info, .ticket-header, .ticket-totals-row, .ticket-grand-total,
    .ticket-footer, .ticket-cancelado, [data-print-keep] { break-inside: avoid; }
  `
  if (width === null)
    styles.textContent += `
    @media print {
      [data-print-root] { width: 100% !important; max-width: 80mm !important; }
      [data-print-fluid] { width: auto !important; min-width: 0 !important; }
      .ticket-row, .ticket-table-header { grid-template-columns: 24px minmax(0, 1fr) max-content !important; }
    }
  `
  doc.head.append(styles)
  const clone = element.cloneNode(true) as HTMLElement
  const originals = [element, ...Array.from(element.querySelectorAll<HTMLElement>('*'))]
  const copies = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))]
  originals.forEach((node, index) => {
    const copy = copies[index]!
    const computed = view.getComputedStyle(node)
    if (
      width === null &&
      node !== element &&
      ['block', 'flex', 'grid'].includes(computed.display) &&
      !['IMG', 'CANVAS', 'SVG'].includes(node.tagName) &&
      !node.classList.contains('q-separator--vertical')
    )
      copy.setAttribute('data-print-fluid', '')
    copy.removeAttribute('style')
    for (const name of Array.from(computed))
      copy.style.setProperty(name, computed.getPropertyValue(name))
    // Retain intrinsic image/separator dimensions, but let block containers collapse margins
    // and fragment naturally, exactly as they do in the live DOM.
    if (
      ['block', 'flex', 'grid', 'inline-flex', 'inline-grid'].includes(computed.display) &&
      !['IMG', 'CANVAS', 'SVG', 'HR'].includes(node.tagName) &&
      !node.classList.contains('q-separator')
    ) {
      copy.style.height = 'auto'
    }
    copy.style.maxHeight = 'none'
    copy.style.contentVisibility = 'visible'
    for (const attr of Array.from(copy.attributes)) {
      if (attr.name.startsWith('on')) copy.removeAttribute(attr.name)
    }
    if (node.tagName === 'TEXTAREA') copy.textContent = (node as HTMLTextAreaElement).value
    if (node.tagName === 'INPUT') copy.setAttribute('value', (node as HTMLInputElement).value)
    for (const pseudo of ['::before', '::after']) {
      const declaration = view.getComputedStyle(node, pseudo)
      if (!declaration.content || ['none', 'normal'].includes(declaration.content)) continue
      const id = `print-${index}`
      copy.setAttribute('data-print-node', id)
      const rule = Array.from(declaration)
        .map((name) => `${name}:${declaration.getPropertyValue(name)};`)
        .join('')
      styles.textContent += `\n[data-print-node="${id}"]${pseudo}{${rule}}`
    }
  })
  clone.querySelectorAll(excluded).forEach((node) => node.remove())
  clone.setAttribute('data-print-root', '')
  doc.body.append(clone)
  return doc
}

async function waitForAssets(doc: Document, root: ParentNode = doc): Promise<void> {
  // Force layout so newly inserted font faces enter the document's loading set.
  void doc.body.offsetHeight
  const assets = Promise.all([
    doc.fonts?.ready,
    ...Array.from(root.querySelectorAll('img')).map(async (img) => {
      if (img.decode) await img.decode()
      else if (!img.complete)
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('No se pudo cargar una imagen del comprobante.'))
        })
      if (!img.naturalWidth) throw new Error('No se pudo cargar una imagen del comprobante.')
    }),
  ])
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      assets,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('El comprobante tardó demasiado en cargar. Intenta nuevamente.')),
          15000,
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

let printing = false

/** Opens the native dialog; closing it does not prove that paper was printed. */
export async function printTicketElement(
  element: HTMLElement | null,
  width: TicketWidth | null = null,
): Promise<void> {
  if (!element) throw new Error('El comprobante todavía no está listo para imprimir.')
  if (printing) throw new Error('Ya hay un comprobante en preparación para imprimir.')
  printing = true
  let frame: HTMLIFrameElement | undefined
  try {
    await waitForAssets(element.ownerDocument, element)
    // Reflow wider reports to their paper width before taking the snapshot.
    const originalStyle = element.getAttribute('style')
    let snapshot: Document
    try {
      element.style.setProperty('width', ticketContentWidth(width ?? 80), 'important')
      element.style.setProperty('max-width', 'none', 'important')
      snapshot = createTicketDocument(element, width)
    } finally {
      if (originalStyle === null) element.removeAttribute('style')
      else element.setAttribute('style', originalStyle)
    }
    frame = document.createElement('iframe')
    frame.title = 'Impresión de comprobante'
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${ticketContentWidth(width ?? 80)};height:297mm;border:0;`
    document.body.append(frame)
    const doc = frame.contentDocument
    const win = frame.contentWindow
    if (!doc || !win) throw new Error('No se pudo abrir el comprobante para imprimir.')
    doc.open()
    doc.write(`<!DOCTYPE html>${snapshot.documentElement.outerHTML}`)
    doc.close()
    await waitForAssets(doc)
    if (width !== null && width !== 210) {
      const receipt = doc.querySelector<HTMLElement>('[data-print-root]')!
      const heightMm = Math.max(
        40,
        Math.ceil(
          (Math.max(receipt.scrollHeight, receipt.getBoundingClientRect().height) * 25.4) / 96,
        ) + 2,
      )
      const pageStyle = doc.createElement('style')
      pageStyle.textContent = `@page { size: ${width}mm ${Math.min(heightMm, 1000)}mm; margin: 0; }`
      doc.head.append(pageStyle)
    }
    await new Promise<void>((resolve, reject) => {
      // Keep the document alive while print preview is open, including cancellation.
      const timer = setTimeout(() => {
        cleanup()
        resolve()
      }, 300000)
      const cleanup = () => {
        clearTimeout(timer)
        win.removeEventListener('afterprint', finished)
      }
      const finished = () => {
        cleanup()
        resolve()
      }
      win.addEventListener('afterprint', finished, { once: true })
      try {
        win.focus()
        win.print()
      } catch (error) {
        cleanup()
        reject(error)
      }
    })
  } finally {
    frame?.remove()
    printing = false
  }
}
