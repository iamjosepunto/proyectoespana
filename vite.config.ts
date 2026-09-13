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

// Se lee el JSON en vez de importar src/rutas.ts: un import relativo sin
// extension rompe tsc cuando moduleResolution es node16 o nodenext
const RAIZ = process.cwd()
const TABLA = JSON.parse(
  readFileSync(join(RAIZ, 'src', 'slugs.json'), 'utf8')
) as { principal: Record<Idioma, string[]>; apps: Record<Idioma, string[]> }
const SLUGS = TABLA.principal
const SLUGS_APPS = TABLA.apps
const APPS = SLUGS.en.indexOf('apps')

function leerDiccionario(idioma: Idioma) {
  const crudo = readFileSync(join(RAIZ, 'src', 'locales', `${idioma}.json`), 'utf8')
  return JSON.parse(crudo) as {
    meta: { title: string; description: string }
    hero: { title: string }
    videos: Record<string, string>
    apps: Record<string, string>
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

function paginaDe(plantilla: string, idioma: Idioma, indice: number, sub: number | null = null) {
  const dic = leerDiccionario(idioma)
  const alterno: Idioma = idioma === 'es' ? 'en' : 'es'
  const cola = sub === null ? '' : `/${SLUGS_APPS[idioma][sub]}`
  const camino = `/${idioma}/${SLUGS[idioma][indice]}${cola}`
  const url = `${DOMINIO}${camino}`
  // La clave del diccionario es el propio slug, asi el orden lo manda slugs.json
  const nombre = sub === null ? dic.videos[`v${indice}`] : dic.apps[SLUGS_APPS[idioma][sub]]
  const titulo = `${nombre} \u2014 ${dic.hero.title}`
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
    `<link rel="alternate" hreflang="${alterno}" href="${DOMINIO}/${alterno}/${SLUGS[alterno][indice]}${sub === null ? '' : `/${SLUGS_APPS[alterno][sub]}`}" />`,
    `<link rel="alternate" hreflang="x-default" href="${DOMINIO}/en/${SLUGS.en[indice]}${sub === null ? '' : `/${SLUGS_APPS.en[sub]}`}" />`
  ].join('\n    ')

  return html.replace(/<\/head>/i, `  ${alternas}\n  </head>`)
}

function sitemapDe() {
  const urls = IDIOMAS.flatMap((idioma) => [
    ...SLUGS[idioma].map((slug: string) => `  <url><loc>${DOMINIO}/${idioma}/${slug}</loc></url>`),
    ...SLUGS_APPS[idioma].map(
      (slug: string) => `  <url><loc>${DOMINIO}/${idioma}/${SLUGS[idioma][APPS]}/${slug}</loc></url>`
    )
  ])
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

// Genera una carpeta por seccion e idioma, cada una con su index.html propio.
// Asi GitHub Pages responde 200 con el titulo correcto sin redirigir a nada
function prerenderizar(): Plugin {
  return {
    name: 'proyectoespana-prerender',
    apply: 'build',
    closeBundle() {
      const salida = join(RAIZ, 'dist')
      const raiz = join(salida, 'index.html')
      const plantilla = readFileSync(raiz, 'utf8')
      let generadas = 0

      for (const idioma of IDIOMAS) {
        SLUGS[idioma].forEach((slug: string, indice: number) => {
          const carpeta = join(salida, idioma, slug)
          mkdirSync(carpeta, { recursive: true })
          writeFileSync(join(carpeta, 'index.html'), paginaDe(plantilla, idioma, indice), 'utf8')
          generadas++
        })

        // Las dos apps cuelgan de APPS: /idioma/apps/nombre
        SLUGS_APPS[idioma].forEach((slug: string, sub: number) => {
          const carpeta = join(salida, idioma, SLUGS[idioma][APPS], slug)
          mkdirSync(carpeta, { recursive: true })
          writeFileSync(join(carpeta, 'index.html'), paginaDe(plantilla, idioma, APPS, sub), 'utf8')
          generadas++
        })
      }

      // La raiz apunta a la primera seccion en ingles para no duplicar contenido
      writeFileSync(
        raiz,
        plantilla.replace(
          /<link\s+rel="canonical"[\s\S]*?\/?>/i,
          `<link rel="canonical" href="${DOMINIO}/en/${SLUGS.en[0]}" />`
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
