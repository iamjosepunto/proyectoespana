// UBICACION: src/App.tsx
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import type { SupportedLanguage } from './i18n'
import i18next from './i18n'
import { APPS, SLUGS_APPS, leerRuta, rutaDe } from './rutas'

const PORTADAS: Record<SupportedLanguage, string[]> = {
  en: ['/portada-construccion-en.webp', '/portada-construccion-en.webp'],
  es: ['/portada-construccion-es.webp', '/portada-construccion-es.webp']
}

// Las dos apps llevan su portada por nombre y no por numero: asi no hay que
// rehacerlas si algun dia cambia la posicion de APPS en la lista
const PORTADAS_APPS: Record<SupportedLanguage, string[]> = {
  en: ['/portada-construccion-en.webp'],
  es: ['/portada-construccion-es.webp']
}

// La portada depende del idioma activo; un idioma inesperado cae al ingles
function portadaDe(idioma: string, indice: number, sub: number | null) {
  const lang = (PORTADAS[idioma as SupportedLanguage] ? idioma : 'en') as SupportedLanguage
  return sub === null ? PORTADAS[lang][indice] : PORTADAS_APPS[lang][sub]
}

// Aire entre el borde derecho de la imagen y lo que se apoya en ella: el pie y la
// pildora de estado
const SEPARACION = 5

const OG_LOCALES: Record<string, string> = {
  es: 'es_ES',
  en: 'en_US'
}

// La direccion manda sobre el idioma guardado: entrar en /es/... deja la web
// en espanol. Se resuelve antes del primer render para que no haya parpadeo
const RUTA_INICIAL = leerRuta(window.location.pathname)
if (RUTA_INICIAL) void i18next.changeLanguage(RUTA_INICIAL.idioma)

// APPS nunca se queda vacio: si no viene app en la direccion, se abre la primera
const SUB_INICIAL =
  RUTA_INICIAL === null ? null : RUTA_INICIAL.indice === APPS ? (RUTA_INICIAL.sub ?? 0) : null

// Los dos menus comparten aspecto: se saca aqui para no repetir las clases
function claseBoton(activo: boolean, creciendo = true) {
  return [
    'flex cursor-pointer items-center rounded-sm px-1.5 py-1 text-left font-mono text-[0.66rem] uppercase leading-tight tracking-[0.08em]',
    // En el submenu solo hay tres botones: conservan el alto de una fila de las
    // doce y el resto de la columna queda vacio
    creciendo ? 'flex-none basis-[calc(100%/12)]' : 'flex-none basis-[calc(100%/12)]',
    'transition-colors sm:px-3 sm:py-2 sm:text-[1.05rem] sm:tracking-[0.14em]',
    'border-l-[3px]',
    activo
      ? 'border-accent bg-logo text-crema'
      : 'border-transparent text-muted hover:border-line hover:text-crema'
  ].join(' ')
}

// Submenu de APPS: VOLVER cierra, las demas abren su tutorial. El orden y las
// claves salen de slugs.json, asi que reordenarlas no obliga a tocar el codigo
const APPS_MENU = [
  { clave: 'apps.volver', sub: null as number | null },
  ...SLUGS_APPS.en.map((slug, i) => ({ clave: `apps.${slug}`, sub: i as number | null }))
]

function setMeta(selector: string, content: string) {
  const tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (tag) tag.content = content
}

export default function App() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const imagen = useRef<HTMLImageElement>(null)
  const [intro, setIntro] = useState<'dentro' | 'saliendo' | 'fuera'>('dentro')
  const [videoActivo, setVideoActivo] = useState(RUTA_INICIAL?.indice ?? 0)
  const [appActiva, setAppActiva] = useState<number | null>(SUB_INICIAL)
  // El submenu se abre al entrar en APPS y tambien al llegar por una ruta anidada
  const [enApps, setEnApps] = useState(RUTA_INICIAL?.indice === APPS)
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const menu = useRef<HTMLElement>(null)
  const [borde, setBorde] = useState({ izq: 0, der: 0, ancho: 0 })
  const [esEscritorio, setEsEscritorio] = useState(false)
  const zonaVideo = useRef<HTMLDivElement>(null)
  const pie = useRef<HTMLElement>(null)
  const logoIntro = useRef<HTMLImageElement>(null)
  const logoCabecera = useRef<HTMLImageElement>(null)
  const sloganIntro = useRef<HTMLParagraphElement>(null)
  const sloganCabecera = useRef<HTMLParagraphElement>(null)
  const [viaje, setViaje] = useState<string | undefined>(undefined)
  const [viajeSlogan, setViajeSlogan] = useState<string | undefined>(undefined)

  // La presentacion entra, se mantiene y el logo viaja a la cabecera
  useEffect(() => {
    const aSalir = setTimeout(() => setIntro('saliendo'), 6000)
    const aFuera = setTimeout(() => setIntro('fuera'), 7100)
    return () => {
      clearTimeout(aSalir)
      clearTimeout(aFuera)
    }
  }, [])

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
    const zona = zonaVideo.current
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
    const z = zonaVideo.current
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

  const mostrarVideo = (indice: number, sub: number | null = null) => {
    setVideoActivo(indice)
    setAppActiva(sub)
  }

  // Pulsar en el menu anade una entrada al historial: el boton atras funciona
  const elegirVideo = (indice: number) => {
    // APPS abre el submenu y muestra ya la primera app, para no dejar el hueco vacio
    const sub = indice === APPS ? 0 : null
    mostrarVideo(indice, sub)
    setEnApps(indice === APPS)
    window.history.pushState(null, '', rutaDe(language, indice, sub))
  }

  const elegirApp = (sub: number) => {
    mostrarVideo(APPS, sub)
    window.history.pushState(null, '', rutaDe(language, APPS, sub))
  }

  // VOLVER cierra el submenu y baja al primer punto de la lista: APPS es solo
  // un enlace, no debe quedarse marcado ni dejar el hueco de la imagen vacio
  const salirDeApps = () => {
    setEnApps(false)
    mostrarVideo(0)
    window.history.pushState(null, '', rutaDe(language, 0))
  }

  // Atras y adelante del navegador
  useEffect(() => {
    const alNavegar = () => {
      const ruta = leerRuta(window.location.pathname)
      if (!ruta) return
      mostrarVideo(ruta.indice, ruta.indice === APPS ? (ruta.sub ?? 0) : ruta.sub)
      setEnApps(ruta.indice === APPS)
      if (ruta.idioma !== language) void i18n.changeLanguage(ruta.idioma)
    }
    window.addEventListener('popstate', alNavegar)
    return () => window.removeEventListener('popstate', alNavegar)
  })

  // APPS es solo un enlace al submenu: no tiene portada propia
  const sinMedia = videoActivo === APPS && appActiva === null

  // El idioma y la seccion activa deben reflejarse en el documento y en la
  // direccion. Tambien cubre la entrada por la raiz, que no tiene camino valido
  useEffect(() => {
    const camino = rutaDe(language, videoActivo, appActiva)
    if (window.location.pathname !== camino) {
      window.history.replaceState(null, '', camino)
    }

    const nombre =
      appActiva === null ? t(`videos.v${videoActivo}`) : t(`apps.${SLUGS_APPS.en[appActiva]}`)
    const title = `${nombre} | ${t('hero.title')}`
    const description = t('meta.description')
    const url = `https://ap3c.app${camino}`

    document.documentElement.lang = language
    document.title = title
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:url"]', url)
    setMeta('meta[property="og:locale"]', OG_LOCALES[language] ?? 'en_US')

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = url
  }, [language, videoActivo, appActiva, t])

  return (
    <div className="relative min-h-dvh overflow-hidden">

      <div aria-hidden="true" className="field pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="halo pointer-events-none absolute inset-0" />


      <nav
        ref={menu}
        aria-label="Videos"
        style={esEscritorio && !pantallaCompleta ? { left: borde.izq } : undefined}
        className={[
          'absolute bottom-[44px] left-0 top-[66px] z-10 flex w-[70px] flex-col sm:bottom-[60px] sm:top-[306px] sm:w-[279px] sm:pl-3 sm:pr-1',
          pantallaCompleta ? 'hidden' : ''
        ].join(' ')}
      >
        {enApps
          ? APPS_MENU.map((entrada, i) => {
              const activo = entrada.sub !== null && entrada.sub === appActiva
              return (
                <button
                  key={entrada.clave}
                  type="button"
                  onClick={() => (entrada.sub === null ? salirDeApps() : elegirApp(entrada.sub))}
                  aria-current={activo ? 'true' : undefined}
                  className={claseBoton(activo, false)}
                >
                  <span className={i === 0 ? undefined : 'min-w-0 hyphens-auto break-words'}>
                    {entrada.sub === null ? `<< ${t(entrada.clave)}` : t(entrada.clave)}
                  </span>
                </button>
              )
            })
          : PORTADAS.en.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => elegirVideo(i)}
                aria-current={i === videoActivo ? 'true' : undefined}
                className={claseBoton(i === videoActivo)}
              >
                {/* Solo el primer punto parte la palabra: es la unica que no cabe entera */}
                <span
                  className={
                    i === 0
                      ? 'min-w-0 hyphens-auto break-words'
                      : undefined
                  }
                >
                  {i === APPS ? `${t('videos.v' + i)} >>` : t(`videos.v${i}`)}
                </span>
              </button>
            ))}
      </nav>

      <div
        ref={zonaVideo}
        className={
          pantallaCompleta
            ? 'fixed inset-0 z-40 bg-fondo'
            : 'absolute bottom-[48px] left-[70px] right-0 top-[58px] m-auto aspect-[720/1606] h-[min(calc(100dvh-106px),calc((100vw-70px)*2.2306))] sm:bottom-0 sm:left-[220px] sm:top-0 sm:mx-auto sm:my-0 sm:h-dvh'
        }
      >
        {!sinMedia && (
        <img
          ref={imagen}
          src={portadaDe(language, videoActivo, appActiva)}
          alt={appActiva === null ? t(`videos.v${videoActivo}`) : t(`apps.${SLUGS_APPS.en[appActiva]}`)}
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
        alt="App Place Catalog"
        width={600}
        height={547}
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
          'sm:left-0 sm:ml-[14px] sm:right-auto sm:top-[248px] sm:w-[263px] sm:text-[1.09rem] sm:tracking-[0em]',
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
            className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-6"
          >
            <img
              ref={logoIntro}
              src="/logo-proyectoespana.webp"
              alt=""
              width={600}
              height={547}
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
                'origin-top-left whitespace-pre-line text-center font-mono text-base uppercase leading-relaxed tracking-[0.2em] text-crema sm:text-2xl',
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
        <span className="hidden">
          {t('footer.rights')}
        </span>
      </footer>
    </div>
  )
}






























