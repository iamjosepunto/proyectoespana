// UBICACION: src/App.tsx
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import type { SupportedLanguage } from './i18n'
import i18next from './i18n'
import { SLUGS, leerRuta, rutaDe, subsDe } from './rutas'

// Todas las subrutas muestran la misma pantalla de obras hasta que tengan
// contenido propio
const PORTADA: Record<SupportedLanguage, string> = {
  en: '/portada-construccion-en.webp',
  es: '/portada-construccion-es.webp'
}

function portadaDe(idioma: string) {
  return PORTADA[(PORTADA[idioma as SupportedLanguage] ? idioma : 'en') as SupportedLanguage]
}

// Paneles de las subrutas que se leen como carrusel. La imagen es null
// mientras el archivo no exista: asi no se piden recursos que dan 404
type Panel = { clave: string; imagen: string | null; correo?: boolean }

const PANELES: Record<string, Panel[]> = {
  'what-it-is': [
    { clave: 'p1', imagen: '/que-es.webp' },
    { clave: 'p2', imagen: '/por-que.webp' },
    { clave: 'p3', imagen: '/impedimentos.webp' },
    { clave: 'p4', imagen: '/equipo.webp' },
    { clave: 'p5', imagen: '/financiacion.webp' }
  ],
  sentinels: [
    { clave: 'p1', imagen: '/centinela.webp' },
    { clave: 'p2', imagen: '/trayectoria.webp' },
    { clave: 'p3', imagen: '/entrega.webp' },
    { clave: 'p4', imagen: '/credibilidad.webp' }
  ],
  'take-part': [
    { clave: 'p1', imagen: '/candidatura.webp' },
    { clave: 'p2', imagen: '/revision.webp' },
    { clave: 'p3', imagen: '/campana.webp' },
    { clave: 'p4', imagen: '/correo.webp', correo: true }
  ]
}

// Secciones cuyas subrutas se listan en la columna izquierda. Las demas llegan
// a las suyas desde las zonas clicables de su escena
const CON_SUBMENU = ['active-campaigns']

// Aire entre el borde derecho de la imagen y lo que se apoya en ella
const SEPARACION = 5

const OG_LOCALES: Record<string, string> = {
  es: 'es_ES',
  en: 'en_US'
}

const DOMINIO = 'https://xn--proyectoespaa-tkb.dev'

// Unica direccion de contacto del proyecto: vive aqui y no en los diccionarios
// porque es la misma en los dos idiomas y la usa el enlace mailto
const CORREO = 'iamjosepunto@gmail.com'

// La direccion manda sobre el idioma guardado: entrar en /es/... deja la web
// en espanol. Se resuelve antes del primer render para que no haya parpadeo
const RUTA_INICIAL = leerRuta(window.location.pathname)
if (RUTA_INICIAL) void i18next.changeLanguage(RUTA_INICIAL.idioma)

function abreSubmenu(indice: number) {
  return CON_SUBMENU.includes(SLUGS.en[indice]) && subsDe(indice) !== null
}

// La subruta de participar se localiza por su slug ingles, no por su posicion:
// asi el enlace de la pantalla de campanas sigue valiendo si cambia el orden
function destinoParticipar() {
  const indice = SLUGS.en.indexOf('introduction')
  const tabla = indice === -1 ? null : subsDe(indice)
  const sub = tabla ? tabla.en.indexOf('take-part') : -1
  return indice === -1 || sub === -1 ? null : { indice, sub }
}

const PARTICIPAR = destinoParticipar()

const INTRO_VISTA = 'intro-vista'

// La presentacion solo tiene sentido al entrar por la puerta principal: si la
// direccion apunta a otra seccion o a una subruta, o si ya se vio en esta
// sesion, se entra directo al contenido
function tocaPresentacion() {
  if (RUTA_INICIAL && (RUTA_INICIAL.indice !== 0 || RUTA_INICIAL.sub !== null)) return false
  try {
    return sessionStorage.getItem(INTRO_VISTA) !== '1'
  } catch {
    return true
  }
}

// Una seccion con submenu nunca se queda vacia: si no viene subruta, se abre la primera
const SUB_INICIAL =
  RUTA_INICIAL === null
    ? null
    : abreSubmenu(RUTA_INICIAL.indice)
      ? (RUTA_INICIAL.sub ?? 0)
      : RUTA_INICIAL.sub

// Los dos menus comparten aspecto: se saca aqui para no repetir las clases
function claseBoton(activo: boolean) {
  return [
    'flex cursor-pointer items-center rounded-sm px-1.5 py-1 text-left font-mono text-[0.66rem] uppercase leading-tight tracking-[0.08em]',
    // Cada entrada conserva el alto de una fila de doce y el resto de la
    // columna queda vacio
    'flex-none basis-[calc(100%/12)]',
    'transition-colors sm:px-3 sm:py-2 sm:text-[1.05rem] sm:tracking-[0.14em]',
    'border-y border-y-crema border-l-[3px]',
    activo
      ? 'border-l-accent bg-logo text-crema'
      : 'border-l-transparent text-muted hover:border-l-line hover:text-crema'
  ].join(' ')
}

function setMeta(selector: string, content: string) {
  const tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (tag) tag.content = content
}

// Escena de INTRODUCCION: todo dibujado en codigo salvo el logo, que se trae
// del archivo. Las zonas de abajo llevan cada una a su propia subruta
function EscenaIntroduccion({
  titulo,
  etiquetas,
  alPulsar
}: {
  titulo: string
  etiquetas: string[]
  alPulsar: (sub: number) => void
}) {
  const ALTO = 150
  const HUECO = 44
  const LOGO_Y = 70
  const LOGO_LADO = 720
  // La primera zona arranca un hueco por debajo de la base del logo: asi la
  // separacion con el logo es la misma que la que hay entre zonas
  const PRIMERA = LOGO_Y + LOGO_LADO + HUECO

  return (
    <svg
      viewBox="0 0 720 1606"
      role="group"
      aria-label={titulo}
      className="h-full w-full border border-crema"
    >
      <rect width="720" height="1606" fill="var(--color-fondo)" />

      <image x="0" y={LOGO_Y} width={LOGO_LADO} height={LOGO_LADO} href="/logo-proyectoespana.webp" />

      {etiquetas.map((texto, i) => (
        <g
          key={texto}
          role="button"
          tabIndex={0}
          aria-label={texto}
          onClick={() => alPulsar(i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              alPulsar(i)
            }
          }}
          className="group cursor-pointer"
        >
          <rect
            x="70"
            y={PRIMERA + i * (ALTO + HUECO)}
            width="580"
            height={ALTO}
            className="fill-transparent stroke-crema transition-colors group-hover:fill-crema/15"
            strokeWidth="2"
          />
          <foreignObject x="70" y={PRIMERA + i * (ALTO + HUECO)} width="580" height={ALTO}>
            <div
              className="flex h-full w-full items-center justify-center px-8 text-center font-mono text-[34px] uppercase leading-tight tracking-[2px] text-enlace transition-colors group-hover:text-accent"
            >
              {texto}
            </div>
          </foreignObject>
        </g>
      ))}
    </svg>
  )
}

// Carrusel de una subruta: una imagen, su texto y navegacion ciclica. Las
// medidas van en cqw para que todo escale con el ancho de la caja
function Carrusel({
  ruta,
  paneles,
  alVolver
}: {
  ruta: string
  paneles: Panel[]
  alVolver: (() => void) | null
}) {
  const { t } = useTranslation()
  const [i, setI] = useState(0)
  const total = paneles.length
  const ir = (paso: number) => setI((n) => (n + paso + total) % total)
  const panel = paneles[i]
  const base = `paneles.${ruta}.${panel.clave}`

  return (
    <div
      className="relative flex h-full w-full flex-col border border-crema bg-fondo"
      style={{ containerType: 'size' }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') ir(-1)
        if (e.key === 'ArrowRight') ir(1)
      }}
      tabIndex={0}
    >
      <div style={{ padding: '5cqw 5cqw 0' }}>
        {panel.imagen ? (
          <img
            src={panel.imagen}
            alt={t(`${base}.titulo`)}
            width={900}
            height={900}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div
            className="flex aspect-square w-full items-center justify-center border border-dashed border-line text-muted"
            style={{ fontSize: '3.4cqw', letterSpacing: '0.1em' }}
          >
            {panel.clave.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden" style={{ padding: '5cqw' }}>
        <h2
          className="font-mono uppercase text-accent"
          style={{ fontSize: '7cqw', letterSpacing: '0.08em', marginBottom: '2.5cqw' }}
        >
          {t(`${base}.titulo`)}
        </h2>
        <p className="text-ink/80" style={{ fontSize: '6cqw', lineHeight: 1.65 }}>
          {t(`${base}.texto`)}
        </p>
        {panel.correo && <BloqueCorreo />}
      </div>

      <div
        className="flex items-center justify-between border-t border-line/60"
        style={{ padding: '3cqw 5cqw' }}
      >
        {alVolver && (
          <button
            type="button"
            onClick={alVolver}
            className="cursor-pointer font-mono uppercase text-enlace transition-colors hover:text-accent"
            style={{ fontSize: '4cqw', letterSpacing: '0.1em', lineHeight: 1 }}
          >
            {`<< ${t('subs.volver')}`}
          </button>
        )}

        <div className="ml-auto flex items-center" style={{ gap: '3.5cqw' }}>
          <button
            type="button"
            onClick={() => ir(-1)}
            aria-label={t('paneles.anterior')}
            className="cursor-pointer font-mono text-enlace transition-colors hover:text-accent"
            style={{ fontSize: '6cqw', lineHeight: 1 }}
          >
            &lt;
          </button>

          <div className="flex" style={{ gap: '2.2cqw' }}>
            {paneles.map((p, n) => (
              <button
                key={p.clave}
                type="button"
                onClick={() => setI(n)}
                aria-label={`${n + 1}`}
                aria-current={n === i ? 'true' : undefined}
                className={[
                  'cursor-pointer rounded-full transition-colors',
                  n === i ? 'bg-accent' : 'bg-line hover:bg-crema/60'
                ].join(' ')}
                style={{ width: '2.4cqw', height: '2.4cqw' }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => ir(1)}
            aria-label={t('paneles.siguiente')}
            className="cursor-pointer font-mono text-enlace transition-colors hover:text-accent"
            style={{ fontSize: '6cqw', lineHeight: 1 }}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  )
}

// Direccion de contacto con boton de copiar. La usan la pantalla de contacto y
// el panel que explica donde se envia la candidatura
function BloqueCorreo() {
  const { t } = useTranslation()
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    if (!navigator.clipboard) return
    void navigator.clipboard.writeText(CORREO).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <div className="flex flex-wrap items-center" style={{ gap: '4cqw', marginTop: '6cqw' }}>
      <a
        href={`mailto:${CORREO}`}
        className="break-all font-mono text-crema underline decoration-accent/70 underline-offset-4 transition-colors hover:text-accent"
        style={{ fontSize: '5cqw', letterSpacing: '0.04em' }}
      >
        {CORREO}
      </a>
      <button
        type="button"
        onClick={copiar}
        className="cursor-pointer border border-accent bg-accent font-mono uppercase text-deep transition-colors hover:border-crema hover:bg-crema"
        style={{ fontSize: '4cqw', letterSpacing: '0.1em', padding: '1.5cqw 3cqw' }}
      >
        {copiado ? t('contacto.copiado') : t('contacto.copiar')}
      </button>
    </div>
  )
}

// Pantalla de la seccion de contacto: texto y la direccion como enlace
function PantallaContacto({ alParticipar }: { alParticipar: (() => void) | null }) {
  const { t } = useTranslation()

  return (
    <div
      className="flex h-full w-full flex-col justify-center border border-crema bg-fondo"
      style={{ containerType: 'size' }}
    >
      <div style={{ padding: '8cqw' }}>
        <h2
          className="font-mono uppercase text-accent"
          style={{ fontSize: '7cqw', letterSpacing: '0.08em', marginBottom: '4cqw' }}
        >
          {t('contacto.titulo')}
        </h2>
        <p className="text-ink/80" style={{ fontSize: '6cqw', lineHeight: 1.65 }}>
          {t('contacto.texto')}
        </p>
        <BloqueCorreo />
        {alParticipar && (
          <button
            type="button"
            onClick={alParticipar}
            className="cursor-pointer font-mono uppercase text-enlace transition-colors hover:text-accent"
            style={{ fontSize: '5cqw', letterSpacing: '0.1em', marginTop: '8cqw' }}
          >
            {`${t('subs.take-part')} >>`}
          </button>
        )}
      </div>
    </div>
  )
}

// Pantalla de la seccion de campanas mientras no haya ninguna abierta
function PantallaCampanas({ alParticipar }: { alParticipar: (() => void) | null }) {
  const { t } = useTranslation()

  return (
    <div
      className="flex h-full w-full flex-col justify-center border border-crema bg-fondo"
      style={{ containerType: 'size' }}
    >
      <div style={{ padding: '8cqw' }}>
        <h2
          className="font-mono uppercase text-accent"
          style={{ fontSize: '7cqw', letterSpacing: '0.08em', marginBottom: '4cqw' }}
        >
          {t('campanas.titulo')}
        </h2>
        <p className="text-ink/80" style={{ fontSize: '6cqw', lineHeight: 1.65 }}>
          {t('campanas.texto')}
        </p>
        {alParticipar && (
          <button
            type="button"
            onClick={alParticipar}
            className="cursor-pointer font-mono uppercase text-enlace transition-colors hover:text-accent"
            style={{ fontSize: '5cqw', letterSpacing: '0.1em', marginTop: '8cqw' }}
          >
            {`${t('campanas.enlace')} >>`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const [intro, setIntro] = useState<'dentro' | 'saliendo' | 'fuera'>(() =>
    tocaPresentacion() ? 'dentro' : 'fuera'
  )
  const [seccion, setSeccion] = useState(RUTA_INICIAL?.indice ?? 0)
  const [subActiva, setSubActiva] = useState<number | null>(SUB_INICIAL)
  // El submenu se abre al entrar en la seccion y tambien al llegar por una ruta anidada
  const [enSubmenu, setEnSubmenu] = useState(
    RUTA_INICIAL ? abreSubmenu(RUTA_INICIAL.indice) : false
  )
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const menu = useRef<HTMLElement>(null)
  const [borde, setBorde] = useState({ izq: 0, der: 0, ancho: 0 })
  const [esEscritorio, setEsEscritorio] = useState(false)
  const zonaImagen = useRef<HTMLDivElement>(null)
  const pie = useRef<HTMLElement>(null)
  const logoIntro = useRef<HTMLImageElement>(null)
  const logoCabecera = useRef<HTMLImageElement>(null)
  const sloganIntro = useRef<HTMLParagraphElement>(null)
  const sloganCabecera = useRef<HTMLParagraphElement>(null)
  const [viaje, setViaje] = useState<string | undefined>(undefined)
  const [viajeSlogan, setViajeSlogan] = useState<string | undefined>(undefined)

  // La presentacion entra, se mantiene el tiempo de leer el eslogan, y se corta
  // sola o con cualquier clic o tecla
  useEffect(() => {
    if (intro !== 'dentro') return
    try {
      sessionStorage.setItem(INTRO_VISTA, '1')
    } catch {
      // Sin sessionStorage la presentacion sale en cada carga, que era lo de antes
    }

    const saltar = () => setIntro((actual) => (actual === 'dentro' ? 'saliendo' : actual))
    const aSalir = setTimeout(saltar, 8000)
    const sucesos = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    sucesos.forEach((suceso) => window.addEventListener(suceso, saltar, { passive: true }))

    return () => {
      clearTimeout(aSalir)
      sucesos.forEach((suceso) => window.removeEventListener(suceso, saltar))
    }
  }, [intro])

  // El vuelo del logo dura 900ms: al terminar se retira la presentacion entera
  useEffect(() => {
    if (intro !== 'saliendo') return
    const aFuera = setTimeout(() => setIntro('fuera'), 1100)
    return () => clearTimeout(aFuera)
  }, [intro])

  // El destino se mide en pantalla, asi encaja con la cabecera en cualquier tamano
  useEffect(() => {
    if (intro !== 'saliendo') return
    const recorrido = (a?: DOMRect, b?: DOMRect) =>
      a && b ? `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width})` : undefined

    setViaje(recorrido(logoIntro.current?.getBoundingClientRect(), logoCabecera.current?.getBoundingClientRect()))
    setViajeSlogan(
      recorrido(sloganIntro.current?.getBoundingClientRect(), sloganCabecera.current?.getBoundingClientRect())
    )
  }, [intro])

  // Si el navegador no admite pantalla completa sobre el contenedor (Safari en iPhone),
  // se expande por CSS y el resultado visual es el mismo
  const alternarPantallaCompleta = () => {
    const zona = zonaImagen.current
    if (!zona) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    if (typeof zona.requestFullscreen === 'function') {
      zona.requestFullscreen().catch(() => setPantallaCompleta((v) => !v))
      return
    }
    setPantallaCompleta((v) => !v)
  }

  // En escritorio todo se agrupa en un escenario del ancho de menu mas imagen
  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 640px)')
    const mirar = () => setEsEscritorio(consulta.matches)
    mirar()
    consulta.addEventListener('change', mirar)
    return () => consulta.removeEventListener('change', mirar)
  }, [])

  // Los bordes del grupo salen de la imagen, que no se mueve de su sitio
  useEffect(() => {
    const n = menu.current
    const z = zonaImagen.current
    if (!n || !z) return
    const medir = () => {
      const r = z.getBoundingClientRect()
      setBorde({
        izq: Math.round(r.left - n.offsetWidth),
        der: Math.round(r.right),
        ancho: n.offsetWidth
      })
    }
    const observador = new ResizeObserver(medir)
    observador.observe(z)
    observador.observe(n)
    medir()
    window.addEventListener('resize', medir)
    return () => {
      observador.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [])

  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', alCambiar)
    return () => document.removeEventListener('fullscreenchange', alCambiar)
  }, [])

  const mostrar = (indice: number, sub: number | null = null) => {
    setSeccion(indice)
    setSubActiva(sub)
  }

  // Pulsar en el menu anade una entrada al historial: el boton atras funciona
  const elegirSeccion = (indice: number) => {
    // Las secciones con submenu abren ya su primera subruta, para no dejar el hueco vacio
    const sub = abreSubmenu(indice) ? 0 : null
    mostrar(indice, sub)
    setEnSubmenu(abreSubmenu(indice))
    window.history.pushState(null, '', rutaDe(language, indice, sub))
  }

  const elegirSub = (sub: number) => {
    mostrar(seccion, sub)
    window.history.pushState(null, '', rutaDe(language, seccion, sub))
  }

  // Las subrutas a las que solo se llega desde la escena no tienen entrada en el
  // menu izquierdo: el boton del carrusel es su unica salida de vuelta
  const volverAEscena = () => {
    mostrar(seccion, null)
    window.history.pushState(null, '', rutaDe(language, seccion, null))
  }

  // Salto desde la pantalla de campanas a la subruta de participar
  const irAParticipar = () => {
    if (!PARTICIPAR) return
    setEnSubmenu(false)
    mostrar(PARTICIPAR.indice, PARTICIPAR.sub)
    window.history.pushState(null, '', rutaDe(language, PARTICIPAR.indice, PARTICIPAR.sub))
  }

  // VOLVER cierra el submenu y baja al primer punto de la lista: la seccion con
  // submenu es solo un enlace, no debe quedarse marcada ni dejar el hueco vacio
  const salirDelSubmenu = () => {
    setEnSubmenu(false)
    mostrar(0)
    window.history.pushState(null, '', rutaDe(language, 0))
  }

  // Atras y adelante del navegador
  useEffect(() => {
    const alNavegar = () => {
      const ruta = leerRuta(window.location.pathname)
      if (!ruta) return
      mostrar(ruta.indice, abreSubmenu(ruta.indice) ? (ruta.sub ?? 0) : ruta.sub)
      setEnSubmenu(abreSubmenu(ruta.indice))
      if (ruta.idioma !== language) void i18n.changeLanguage(ruta.idioma)
    }
    window.addEventListener('popstate', alNavegar)
    return () => window.removeEventListener('popstate', alNavegar)
  })

  const tabla = subsDe(seccion)
  const lang = (language === 'es' ? 'es' : 'en') as SupportedLanguage
  // Sin subruta elegida: las secciones con escena la muestran, las de submenu no
  // tienen nada propio que ensenar
  const conEscena = subActiva === null && tabla !== null && !abreSubmenu(seccion)
  const sinMedia = subActiva === null && tabla !== null && abreSubmenu(seccion)

  const rutaSub = subActiva !== null && tabla ? tabla.en[subActiva] : null
  // Campanas activas no tiene subrutas mientras no haya ninguna campana abierta
  const enCampanas = SLUGS.en[seccion] === 'active-campaigns' && subActiva === null
  // Contacto tampoco tiene subrutas: es una sola pantalla
  const enContacto = SLUGS.en[seccion] === 'contact' && subActiva === null

  const nombreActual =
    subActiva === null || !tabla
      ? t(`secciones.v${seccion}`)
      : t(`subs.${tabla.en[subActiva]}`)

  // Entradas del submenu de la seccion activa, con VOLVER delante
  const menuSubs = tabla
    ? [
        { clave: 'subs.volver', sub: null as number | null },
        ...tabla.en.map((slug, i) => ({ clave: `subs.${slug}`, sub: i as number | null }))
      ]
    : []

  // El idioma y la seccion activa deben reflejarse en el documento y en la
  // direccion. Tambien cubre la entrada por la raiz, que no tiene camino valido
  useEffect(() => {
    const camino = rutaDe(language, seccion, subActiva)
    if (window.location.pathname !== camino) {
      window.history.replaceState(null, '', camino)
    }

    const title = `${nombreActual} | ${t('hero.title')}`
    const description = t('meta.description')
    const url = `${DOMINIO}${camino}`

    document.documentElement.lang = language
    document.title = title
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:url"]', url)
    setMeta('meta[property="og:locale"]', OG_LOCALES[language] ?? 'en_US')

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = url
  }, [language, seccion, subActiva, nombreActual, t])

  return (
    <div className="relative min-h-dvh overflow-hidden">

      <div aria-hidden="true" className="field pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="halo pointer-events-none absolute inset-0" />


      <nav
        ref={menu}
        aria-label="Secciones"
        style={esEscritorio && !pantallaCompleta ? { left: borde.izq } : undefined}
        className={[
          'absolute bottom-[44px] left-0 top-[66px] z-10 flex w-[70px] flex-col sm:bottom-[60px] sm:top-[329px] sm:w-[279px] sm:pl-3 sm:pr-1',
          pantallaCompleta ? 'hidden' : ''
        ].join(' ')}
      >
        {enSubmenu
          ? menuSubs.map((entrada, i) => {
              const activo = entrada.sub !== null && entrada.sub === subActiva
              return (
                <button
                  key={entrada.clave}
                  type="button"
                  onClick={() => (entrada.sub === null ? salirDelSubmenu() : elegirSub(entrada.sub))}
                  aria-current={activo ? 'true' : undefined}
                  className={claseBoton(activo)}
                >
                  <span className={i === 0 ? undefined : 'min-w-0 hyphens-auto break-words'}>
                    {entrada.sub === null ? `<< ${t(entrada.clave)}` : t(entrada.clave)}
                  </span>
                </button>
              )
            })
          : SLUGS.en.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => elegirSeccion(i)}
                aria-current={i === seccion ? 'true' : undefined}
                className={claseBoton(i === seccion)}
              >
                <span className="min-w-0 hyphens-auto break-words">
                  {abreSubmenu(i) ? `${t(`secciones.v${i}`)} >>` : t(`secciones.v${i}`)}
                </span>
              </button>
            ))}
      </nav>

      <div
        ref={zonaImagen}
        className={
          pantallaCompleta
            ? 'fixed inset-0 z-40 bg-fondo'
            : 'absolute bottom-[48px] left-[70px] right-0 top-[58px] m-auto aspect-[720/1606] h-[min(calc(100dvh-106px),calc((100vw-70px)*2.2306))] sm:bottom-0 sm:left-[220px] sm:top-0 sm:mx-auto sm:my-0 sm:h-dvh'
        }
      >
        {conEscena && tabla && (
          <EscenaIntroduccion
            titulo={t(`secciones.v${seccion}`)}
            etiquetas={tabla.en.map((slug) => t(`subs.${slug}`))}
            alPulsar={elegirSub}
          />
        )}

        {!conEscena && !sinMedia && enCampanas && (
          <PantallaCampanas alParticipar={PARTICIPAR ? irAParticipar : null} />
        )}

        {!conEscena && !sinMedia && enContacto && (
          <PantallaContacto alParticipar={PARTICIPAR ? irAParticipar : null} />
        )}

        {!conEscena && !sinMedia && rutaSub && PANELES[rutaSub] && (
          <Carrusel
            key={rutaSub}
            ruta={rutaSub}
            paneles={PANELES[rutaSub]}
            alVolver={abreSubmenu(seccion) ? null : volverAEscena}
          />
        )}

        {!conEscena && !sinMedia && !enCampanas && !enContacto && !(rutaSub && PANELES[rutaSub]) && (
          <img
            src={portadaDe(lang)}
            alt={nombreActual}
            width={720}
            height={1606}
            onDoubleClick={alternarPantallaCompleta}
            className="h-full w-full border border-crema object-contain"
          />
        )}
      </div>

      <img
        ref={logoCabecera}
        style={esEscritorio && !pantallaCompleta ? { left: borde.izq } : undefined}
        src="/logo-proyectoespana.webp"
        alt={t('hero.title')}
        width={800}
        height={800}
        className={[
          'absolute left-0 top-0 z-10 w-[68px] sm:ml-[14px] sm:w-[263px]',
          intro === 'fuera' ? 'opacity-100' : 'opacity-0'
        ].join(' ')}
      />

      <p
        ref={sloganCabecera}
        style={esEscritorio && !pantallaCompleta ? { left: borde.izq } : undefined}
        className={[
          'absolute left-[72px] right-[110px] top-[20px] z-10 whitespace-pre text-center font-mono text-[0.78rem] uppercase leading-snug tracking-[0.06em] text-crema',
          'sm:left-0 sm:ml-[14px] sm:right-auto sm:top-[236px] sm:w-[263px] sm:text-[1.09rem] sm:tracking-[0em]',
          intro === 'fuera' ? 'opacity-100' : 'opacity-0'
        ].join(' ')}
      >
        {t('hero.slogan')}
      </p>

      {intro !== 'fuera' && (
        <>
          <div
            aria-hidden="true"
            className={[
              'fixed inset-0 z-40 bg-fondo transition-opacity duration-[900ms]',
              intro === 'saliendo' ? 'opacity-0' : 'opacity-100'
            ].join(' ')}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-0 px-6"
          >
            <img
              ref={logoIntro}
              src="/logo-proyectoespana.webp"
              alt=""
              width={800}
              height={800}
              style={intro === 'saliendo' ? { transform: viaje } : undefined}
              className={[
                'w-full max-w-none sm:w-[480px]',
                intro === 'dentro'
                  ? 'intro-logo origin-center'
                  : 'origin-top-left transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)]'
              ].join(' ')}
            />
            <p
              ref={sloganIntro}
              style={intro === 'saliendo' ? { transform: viajeSlogan } : undefined}
              className={[
                '-mt-9 origin-top-left whitespace-pre-line text-center font-mono text-base uppercase leading-relaxed tracking-[0.2em] text-crema sm:text-2xl',
                intro === 'dentro'
                  ? 'intro-slogan'
                  : 'transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)]'
              ].join(' ')}
            >
              {t('hero.slogan')}
            </p>
          </div>
        </>
      )}

      <header style={esEscritorio && !pantallaCompleta ? { left: borde.der } : undefined} className="absolute right-1 top-[21px] z-20 sm:right-auto sm:top-4">
        <LanguageSwitcher />
      </header>

      <footer
        ref={pie}
        style={
          esEscritorio && !pantallaCompleta
            ? { left: borde.der + SEPARACION, maxWidth: borde.ancho }
            : undefined
        } className="absolute bottom-1 left-[70px] right-0 z-20 flex flex-col items-center gap-y-0.5 font-mono text-[0.7rem] tracking-[0.1em] text-muted/70 sm:bottom-2 sm:left-2 sm:right-auto sm:items-start sm:text-left sm:text-xs">
        <span className="order-2 flex items-center whitespace-nowrap">
          {`©${new Date().getFullYear()}`}
          <span className="ml-1.5 text-[0.6rem] sm:text-xs">{t('footer.rights')}</span></span><span className="order-1 flex items-center gap-1.5 whitespace-nowrap">By<a href="https://iamjosepunto.github.io" target="_blank" rel="noopener noreferrer" className="text-crema/80 transition-colors hover:text-crema">IamJosePunto.GitHub.io</a>
        </span>
      </footer>
    </div>
  )
}


