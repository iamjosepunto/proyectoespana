// UBICACION: vite.config.ts
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// El dominio va en punycode: es la forma ASCII valida en URLs, canonicals y sitemap
const DOMINIO = 'https://xn--proyectoespaa-tkb.dev'
const IDIOMAS = ['en', 'es'] as const
const OG_LOCALES = { en: 'en_US', es: 'es_ES' } as const

type Idioma = (typeof IDIOMAS)[number]
type TablaIdiomas = Record<Idioma, string[]>

// Se lee el JSON en vez de importar src/rutas.ts: un import relativo sin
// extension rompe tsc cuando moduleResolution es node16 o nodenext
const RAIZ = process.cwd()
const TABLA = JSON.parse(
  readFileSync(join(RAIZ, 'src', 'slugs.json'), 'utf8')
) as { principal: TablaIdiomas; subs: Record<string, TablaIdiomas> }
const SLUGS = TABLA.principal
const SUBS = TABLA.subs

// Las subrutas se indexan por el slug ingles de su seccion padre
function subsDe(indice: number): TablaIdiomas | null {
  const padre = SLUGS.en[indice]
  return padre && SUBS[padre] ? SUBS[padre] : null
}

function leerDiccionario(idioma: Idioma) {
  const crudo = readFileSync(join(RAIZ, 'src', 'locales', `${idioma}.json`), 'utf8')
  return JSON.parse(crudo) as {
    meta: { title: string; description: string }
    hero: { title: string }
    secciones: Record<string, string>
    subs: Record<string, string>
  }
}

function escapar(texto: string) {
  return texto.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

// Sustituye el contenido de una etiqueta meta sin depender del formato ni de
// los saltos de linea, que vite puede haber compactado al compilar
function ponerMeta(html: string, atributo: string, clave: string, valor: string) {
  const patron = new RegExp(`<meta\\s+${atributo}="${clave}"[\\s\\S]*?/?>`, 'i')
  return html.replace(patron, `<meta ${atributo}="${clave}" content="${escapar(valor)}" />`)
}

// Camino de una seccion o subseccion en un idioma dado
function caminoDe(idioma: Idioma, indice: number, sub: number | null) {
  const base = `/${idioma}/${SLUGS[idioma][indice]}`
  if (sub === null) return base
  const tabla = subsDe(indice)
  return tabla ? `${base}/${tabla[idioma][sub]}` : base
}

function paginaDe(plantilla: string, idioma: Idioma, indice: number, sub: number | null = null) {
  const dic = leerDiccionario(idioma)
  const alterno: Idioma = idioma === 'es' ? 'en' : 'es'
  const tabla = subsDe(indice)
  const camino = caminoDe(idioma, indice, sub)
  const url = `${DOMINIO}${camino}`
  // La clave del diccionario es el slug ingles, asi el orden lo manda slugs.json
  const nombre =
    sub === null || !tabla ? dic.secciones[`v${indice}`] : dic.subs[tabla.en[sub]]
  const titulo = `${nombre} | ${dic.hero.title}`
  const descripcion = dic.meta.description

  let html = plantilla
  html = html.replace(/<html lang="[^"]*"/i, `<html lang="${idioma}"`)
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapar(titulo)}</title>`)
  html = ponerMeta(html, 'name', 'description', descripcion)
  html = ponerMeta(html, 'property', 'og:title', titulo)
  html = ponerMeta(html, 'property', 'og:description', descripcion)
  html = ponerMeta(html, 'property', 'og:url', url)
  html = ponerMeta(html, 'property', 'og:locale', OG_LOCALES[idioma])
  html = ponerMeta(html, 'property', 'og:locale:alternate', OG_LOCALES[alterno])
  html = html.replace(/<link\s+rel="canonical"[\s\S]*?\/?>/i, `<link rel="canonical" href="${url}" />`)

  // hreflang: le dice al buscador que estas dos paginas son la misma en dos idiomas
  const alternas = [
    `<link rel="alternate" hreflang="${idioma}" href="${url}" />`,
    `<link rel="alternate" hreflang="${alterno}" href="${DOMINIO}${caminoDe(alterno, indice, sub)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${DOMINIO}${caminoDe('es', indice, sub)}" />`
  ].join('\n    ')

  return html.replace(/<\/head>/i, `  ${alternas}\n  </head>`)
}

// Recorre todas las combinaciones de seccion y subseccion que existen
function todasLasRutas() {
  const rutas: { idioma: Idioma; indice: number; sub: number | null }[] = []
  for (const idioma of IDIOMAS) {
    SLUGS[idioma].forEach((_, indice) => {
      rutas.push({ idioma, indice, sub: null })
      const tabla = subsDe(indice)
      if (tabla) tabla[idioma].forEach((__, sub) => rutas.push({ idioma, indice, sub }))
    })
  }
  return rutas
}

function sitemapDe() {
  const urls = todasLasRutas().map(
    (r) => `  <url><loc>${DOMINIO}${caminoDe(r.idioma, r.indice, r.sub)}</loc></url>`
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

// Genera una carpeta por ruta, cada una con su index.html propio. Asi GitHub
// Pages responde 200 con el titulo correcto sin redirigir a nada
function prerenderizar(): Plugin {
  return {
    name: 'proyectoespana-prerender',
    apply: 'build',
    closeBundle() {
      const salida = join(RAIZ, 'dist')
      const raiz = join(salida, 'index.html')
      const plantilla = readFileSync(raiz, 'utf8')
      let generadas = 0

      for (const r of todasLasRutas()) {
        const carpeta = join(salida, ...caminoDe(r.idioma, r.indice, r.sub).split('/').filter(Boolean))
        mkdirSync(carpeta, { recursive: true })
        writeFileSync(
          join(carpeta, 'index.html'),
          paginaDe(plantilla, r.idioma, r.indice, r.sub),
          'utf8'
        )
        generadas++
      }

      // La raiz apunta a la primera seccion en espanol para no duplicar contenido
      writeFileSync(
        raiz,
        plantilla.replace(
          /<link\s+rel="canonical"[\s\S]*?\/?>/i,
          `<link rel="canonical" href="${DOMINIO}/es/${SLUGS.es[0]}" />`
        ),
        'utf8'
      )

      // Red de seguridad: cualquier direccion inventada carga la web igualmente
      copyFileSync(raiz, join(salida, '404.html'))
      writeFileSync(join(salida, 'sitemap.xml'), sitemapDe(), 'utf8')

      console.log(`proyectoespana-prerender: ${generadas} paginas, 404.html y sitemap.xml`)
    }
  }
}

export default defineConfig({
  // Dominio propio: el sitio se sirve desde la raiz, no desde /proyectoespana/
  base: '/',
  plugins: [react(), tailwindcss(), prerenderizar()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
