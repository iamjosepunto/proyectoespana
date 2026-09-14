// UBICACION: src/rutas.ts
import type { SupportedLanguage } from './i18n'
import slugs from './slugs.json'

// Solo se importa el tipo, nunca i18next: asi vite.config.ts puede leer este
// archivo durante la compilacion sin arrastrar la libreria entera
const IDIOMAS: readonly SupportedLanguage[] = ['en', 'es']

type TablaIdiomas = Record<SupportedLanguage, readonly string[]>

// La tabla vive en slugs.json para que vite.config.ts pueda leerla al compilar.
// Los slugs son fijos a proposito y no se derivan de los diccionarios: si cambia
// el texto de un menu, los enlaces ya compartidos siguen valiendo
export const SLUGS: TablaIdiomas = slugs.principal

// Las subrutas cuelgan de su seccion y se indexan por el slug ingles del padre,
// que es el identificador estable: el orden del menu puede cambiar sin romper
// ningun enlace ya compartido
const SUBS = slugs.subs as Record<string, TablaIdiomas>

// Tabla de subrutas de una seccion, o null si esa seccion no tiene
export function subsDe(indice: number): TablaIdiomas | null {
  const padre = SLUGS.en[indice]
  return padre && SUBS[padre] ? SUBS[padre] : null
}

// Cuantas subrutas tiene una seccion. Cero significa que no abre submenu
export function cuantasSubs(indice: number) {
  return subsDe(indice)?.en.length ?? 0
}

// Indices de las secciones que abren submenu en vez de mostrar contenido propio
export const CON_SUBS = SLUGS.en
  .map((_, i) => i)
  .filter((i) => cuantasSubs(i) > 0)

export type Destino = {
  idioma: SupportedLanguage
  indice: number
  sub: number | null
}

export function esIdiomaValido(valor: string): valor is SupportedLanguage {
  return (IDIOMAS as readonly string[]).includes(valor)
}

// Camino del navegador. Con sub se compone la ruta anidada /idioma/seccion/parte
export function rutaDe(idioma: string, indice: number, sub: number | null = null) {
  const lang = esIdiomaValido(idioma) ? idioma : 'en'
  const base = `/${lang}/${SLUGS[lang][indice]}`
  if (sub === null) return base
  const tabla = subsDe(indice)
  return tabla ? `${base}/${tabla[lang][sub]}` : base
}

// Interpreta el camino actual; null si no corresponde a nada conocido
export function leerRuta(camino: string): Destino | null {
  const partes = camino.split('/').filter(Boolean)
  if (partes.length < 2 || partes.length > 3) return null

  const [idioma, slug, slugSub] = partes
  if (!esIdiomaValido(idioma)) return null

  const indice = SLUGS[idioma].indexOf(slug)
  if (indice === -1) return null
  if (partes.length === 2) return { idioma, indice, sub: null }

  // El tercer tramo solo existe si la seccion tiene subrutas declaradas
  const tabla = subsDe(indice)
  if (!tabla) return null
  const sub = tabla[idioma].indexOf(slugSub)
  return sub === -1 ? null : { idioma, indice, sub }
}
