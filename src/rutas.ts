// UBICACION: src/rutas.ts
import type { SupportedLanguage } from './i18n'
import slugs from './slugs.json'

// Solo se importa el tipo, nunca i18next: asi vite.config.ts puede leer este
// archivo durante la compilacion sin arrastrar la libreria entera
const IDIOMAS: readonly SupportedLanguage[] = ['en', 'es']

// La tabla vive en slugs.json para que vite.config.ts pueda leerla al compilar.
// Los slugs son fijos a proposito y no se derivan de los diccionarios: si cambia
// el texto de un menu, los enlaces ya compartidos siguen valiendo
export const SLUGS: Record<SupportedLanguage, readonly string[]> = slugs.principal
export const SLUGS_APPS: Record<SupportedLanguage, readonly string[]> = slugs.apps

// APPS no reproduce nada: abre su propio submenu, colgado de su misma direccion
export const APPS = SLUGS.en.indexOf('apps')

export type Destino = {
  idioma: SupportedLanguage
  indice: number
  sub: number | null
}

export function esIdiomaValido(valor: string): valor is SupportedLanguage {
  return (IDIOMAS as readonly string[]).includes(valor)
}

// Camino del navegador. Con sub se compone la ruta anidada /idioma/apps/nombre
export function rutaDe(idioma: string, indice: number, sub: number | null = null) {
  const lang = esIdiomaValido(idioma) ? idioma : 'en'
  const base = `/${lang}/${SLUGS[lang][indice]}`
  return sub === null ? base : `${base}/${SLUGS_APPS[lang][sub]}`
}

// Interpreta el camino actual; null si no corresponde a nada conocido
export function leerRuta(camino: string): Destino | null {
  const partes = camino.split('/').filter(Boolean)
  if (partes.length < 2 || partes.length > 3) return null

  const [idioma, slug, slugApp] = partes
  if (!esIdiomaValido(idioma)) return null

  const indice = SLUGS[idioma].indexOf(slug)
  if (indice === -1) return null
  if (partes.length === 2) return { idioma, indice, sub: null }

  // El tercer tramo solo existe bajo APPS
  if (indice !== APPS) return null
  const sub = SLUGS_APPS[idioma].indexOf(slugApp)
  return sub === -1 ? null : { idioma, indice, sub }
}
