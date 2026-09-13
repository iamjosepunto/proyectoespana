// UBICACION: src/App.tsx
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import type { SupportedLanguage } from './i18n'
import i18next from './i18n'
import { APPS, SLUGS_APPS, esIdiomaValido, leerRuta, rutaDe } from './rutas'

const VELOCIDADES = [1, 1.5, 2, 3, 4]

const PORTADAS: Record<SupportedLanguage, string[]> = {
  // El numero del archivo es el del tutorial, que empieza en 1, no en 0
  en: Array.from({ length: 12 }, (_, i) => `/portada-${String(i + 1).padStart(2, '0')}-en.webp`),
  es: Array.from({ length: 12 }, (_, i) => `/portada-${String(i + 1).padStart(2, '0')}-es.webp`)
}

// Las dos apps llevan su portada por nombre y no por numero: asi no hay que
// rehacerlas si algun dia cambia la posicion de APPS en la lista
const PORTADAS_APPS: Record<SupportedLanguage, string[]> = {
  en: ['/portada-03-1-en.webp', '/portada-03-2-en.webp'],
  es: ['/portada-03-1-es.webp', '/portada-03-2-es.webp']
}

// La portada depende del idioma activo; un idioma inesperado cae al ingles
function portadaDe(idioma: string, indice: number, sub: number | null) {
  const lang = (PORTADAS[idioma as SupportedLanguage] ? idioma : 'en') as SupportedLanguage
  return sub === null ? PORTADAS[lang][indice] : PORTADAS_APPS[lang][sub]
}

// Salvo EMPEZAR, todos los puntos comparten el mismo video de relleno
const EN_OBRAS = '/video-construccion.mp4'

// Aire entre el borde derecho del video y lo que se apoya en el: el pie y la
// pildora de estado
const SEPARACION = 5

// Tutoriales ya grabados, por numero de tutorial. Cada uno con su archivo por
// idioma; los que faltan usan el video de construccion. Anadir uno nuevo es
// anadir una linea aqui
const GRABADOS: Record<number, Record<SupportedLanguage, string>> = {
  1: {
    en: '/Tutorial_1_Requisitos_EN_reducido.mp4',
    es: '/Tutorial_1_Requisitos_ES_reducido.mp4'
  },
  // El 2, Empezar, sigue con el video provisional, que no tiene version por idioma
  2: { en: '/Prueba.mp4', es: '/Prueba.mp4' }
}

// El video depende del idioma y del punto activo; dentro de APPS siempre es el
// de construccion, porque las dos apps aun no tienen tutorial propio
function videoDe(idioma: string, indice: number, sub: number | null) {
  if (sub !== null) return EN_OBRAS
  const grabado = GRABADOS[indice + 1]
  if (!grabado) return EN_OBRAS
  return grabado[esIdiomaValido(idioma) ? idioma : 'en']
}

function reloj(segundos: number) {
  const m = Math.floor(segundos / 60)
  const s = Math.floor(segundos % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

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
    creciendo ? 'flex-1' : 'flex-none basis-[calc(100%/12)]',
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
  const video = useRef<HTMLVideoElement>(null)
  const [animacionLista, setAnimacionLista] = useState(false)
  const [intro, setIntro] = useState<'dentro' | 'saliendo' | 'fuera'>('dentro')
  const [posicionPanel, setPosicionPanel] = useState<number | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const [videoActivo, setVideoActivo] = useState(RUTA_INICIAL?.indice ?? 0)
  const [appActiva, setAppActiva] = useState<number | null>(SUB_INICIAL)
  // El submenu se abre al entrar en APPS y tambien al llegar por una ruta anidada
  const [enApps, setEnApps] = useState(RUTA_INICIAL?.indice === APPS)
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const [cajaUtil, setCajaUtil] = useState<{ izq: number; ancho: number } | null>(null)
  const menu = useRef<HTMLElement>(null)
  const [borde, setBorde] = useState({ izq: 0, der: 0, ancho: 0 })
  const [altoPie, setAltoPie] = useState(0)
  const [esEscritorio, setEsEscritorio] = useState(false)
  const ocultador = useRef<number | null>(null)
  const zonaVideo = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const pie = useRef<HTMLElement>(null)
  const arrastre = useRef<{ desdeY: number; desdePos: number } | null>(null)
  const logoIntro = useRef<HTMLImageElement>(null)
  const logoCabecera = useRef<HTMLImageElement>(null)
  const sloganIntro = useRef<HTMLParagraphElement>(null)
  const sloganCabecera = useRef<HTMLParagraphElement>(null)
  const [viaje, setViaje] = useState<string | undefined>(undefined)
  const [viajeSlogan, setViajeSlogan] = useState<string | undefined>(undefined)
  const [enPausa, setEnPausa] = useState(true)
  const [velocidad, setVelocidad] = useState(0)
  const [tiempo, setTiempo] = useState(0)
  const [duracion, setDuracion] = useState(0)

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

  // Se reinicia el reproductor cada vez que cambia el archivo, sea por cambio de
  // punto o de idioma. Los puntos en obras comparten archivo, asi que sin load()
  // el <video> conservaria el fotograma ya decodificado y no se veria la portada
  // nueva. Y al cambiar de idioma el navegador recarga parado, asi que los
  // botones tienen que volver a pausa en vez de seguir mostrando la marcha
  useEffect(() => {
    video.current?.load()
    setEnPausa(true)
    setTiempo(0)
    setDuracion(0)
    setAnimacionLista(false)
  }, [videoActivo, appActiva, language])

  // Navegadores con ahorro de datos ignoran el preload y no disparan onLoadedData.
  // Se atiende a varios eventos y, si ninguno llega, se muestra igualmente
  useEffect(() => {
    const v = video.current
    if (!v) return
    const listo = () => setAnimacionLista(true)
    const eventos = ['loadedmetadata', 'loadeddata', 'canplay', 'error'] as const
    eventos.forEach((e) => v.addEventListener(e, listo))
    if (v.readyState >= 1) listo()
    const respaldo = window.setTimeout(listo, 4000)
    return () => {
      eventos.forEach((e) => v.removeEventListener(e, listo))
      window.clearTimeout(respaldo)
    }
  }, [videoActivo, appActiva])

  // Mantiene sincronizados el reloj y la barra con la reproduccion
  useEffect(() => {
    const v = video.current
    if (!v) return
    // defaultPlaybackRate es el que el navegador aplica al cargar la fuente
    v.defaultPlaybackRate = VELOCIDADES[0]
    v.playbackRate = VELOCIDADES[0]
    const alAvanzar = () => setTiempo(v.currentTime)
    const alTenerDatos = () => setDuracion(Number.isFinite(v.duration) ? v.duration : 0)
    v.addEventListener('timeupdate', alAvanzar)
    v.addEventListener('loadedmetadata', alTenerDatos)
    alTenerDatos()
    return () => {
      v.removeEventListener('timeupdate', alAvanzar)
      v.removeEventListener('loadedmetadata', alTenerDatos)
    }
  }, [])

  // El navegador reinicia playbackRate al cargar el video, hay que reaplicarlo
  useEffect(() => {
    if (video.current) video.current.playbackRate = VELOCIDADES[velocidad]
  }, [velocidad, animacionLista])

  // Un solo boton recorre las velocidades y vuelve al principio
  const siguienteVelocidad = () => {
    setVelocidad((i) => (i + 1) % VELOCIDADES.length)
  }

  // El panel se retira solo si nadie lo toca
  const posponerOcultado = () => {
    if (ocultador.current) window.clearTimeout(ocultador.current)
    ocultador.current = window.setTimeout(() => setPanelVisible(false), 4000)
  }

  const alternarPanel = () => {
    setPanelVisible((visible) => {
      if (!visible) posponerOcultado()
      return !visible
    })
  }

  // Al terminar la presentacion el panel se muestra y arranca su cuenta atras
  useEffect(() => {
    if (intro !== 'fuera') return
    setPanelVisible(true)
    posponerOcultado()
    return () => {
      if (ocultador.current) window.clearTimeout(ocultador.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro])

  // El panel se arrastra solo en vertical y sin salirse del area del video
  const empezarArrastre = (e: ReactPointerEvent<HTMLDivElement>) => {
    posponerOcultado()
    if ((e.target as HTMLElement).closest('button, input')) return
    const zona = zonaVideo.current
    const p = panel.current
    if (!zona || !p) return
    arrastre.current = {
      desdeY: e.clientY,
      desdePos: p.getBoundingClientRect().top - zona.getBoundingClientRect().top
    }
    p.setPointerCapture(e.pointerId)
  }

  const moverArrastre = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = arrastre.current
    const zona = zonaVideo.current
    const p = panel.current
    if (!a || !zona || !p) return
    const tope = zona.clientHeight - p.offsetHeight
    setPosicionPanel(Math.min(tope, Math.max(0, a.desdePos + (e.clientY - a.desdeY))))
  }

  const soltarArrastre = (e: ReactPointerEvent<HTMLDivElement>) => {
    posponerOcultado()
    arrastre.current = null
    panel.current?.releasePointerCapture(e.pointerId)
  }

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

  // En escritorio todo se agrupa en un escenario del ancho de menu mas video
  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 640px)')
    const mirar = () => setEsEscritorio(consulta.matches)
    mirar()
    consulta.addEventListener('change', mirar)
    return () => consulta.removeEventListener('change', mirar)
  }, [])

  // Los bordes del grupo salen del video, que no se mueve de su sitio
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

  // Al cambiar el tamano de la zona: recolocar el panel dentro y ajustarlo al video visible
  useEffect(() => {
    const z = zonaVideo.current
    if (!z) return
    const reajustar = () => {
      const ancho = z.clientWidth
      const alto = z.clientHeight
      const util = Math.min(ancho, (alto * 720) / 1606)
      setCajaUtil({ izq: Math.round((ancho - util) / 2), ancho: Math.round(util) })
      const alturaPanel = panel.current?.offsetHeight ?? 0
      setPosicionPanel((pos) => (pos === null ? null : Math.min(Math.max(0, alto - alturaPanel), pos)))
    }
    const observador = new ResizeObserver(reajustar)
    observador.observe(z)
    reajustar()
    return () => observador.disconnect()
  }, [animacionLista])

  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', alCambiar)
    return () => document.removeEventListener('fullscreenchange', alCambiar)
  }, [])

  const mostrarVideo = (indice: number, sub: number | null = null) => {
    setVideoActivo(indice)
    setAppActiva(sub)
    setEnPausa(true)
    setTiempo(0)
    setDuracion(0)
    setAnimacionLista(false)
    setPanelVisible(true)
    posponerOcultado()
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
  // un enlace, no debe quedarse marcado ni dejar el hueco del video vacio
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

  // APPS es solo un enlace al submenu: no tiene portada ni video propios
  const sinMedia = videoActivo === APPS && appActiva === null

  const irA = (segundos: number) => {
    const v = video.current
    if (!v) return
    v.currentTime = segundos
    setTiempo(segundos)
  }

  const alternarPausa = () => {
    const v = video.current
    if (!v) return
    if (v.paused) {
      void v.play()
      setEnPausa(false)
    } else {
      v.pause()
      setEnPausa(true)
    }
  }

  const detener = () => {
    const v = video.current
    if (!v) return
    v.pause()
    v.currentTime = 0
    setEnPausa(true)
  }

  // El pie se coloca a la derecha del video y la pildora justo encima: su alto
  // se mide, no se estima, para que no se solapen al cambiar de idioma o tamano
  useEffect(() => {
    const e = pie.current
    if (!e) return
    const medir = () => setAltoPie(e.offsetHeight)
    const observador = new ResizeObserver(medir)
    observador.observe(e)
    medir()
    return () => observador.disconnect()
  }, [])

  // El idioma y el video activos deben reflejarse en el documento y en la
  // direccion. Tambien cubre la entrada por la raiz, que no tiene camino valido
  useEffect(() => {
    const camino = rutaDe(language, videoActivo, appActiva)
    if (window.location.pathname !== camino) {
      window.history.replaceState(null, '', camino)
    }

    const nombre =
      appActiva === null ? t(`videos.v${videoActivo}`) : t(`apps.${SLUGS_APPS.en[appActiva]}`)
    const title = `${nombre} \u2014 ${t('hero.title')}`
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
          'absolute bottom-[44px] left-0 top-[66px] z-10 flex w-[70px] flex-col sm:bottom-[60px] sm:top-[190px] sm:w-fit sm:pl-3 sm:pr-1',
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
                      : // APPs lleva la ese minuscula a proposito, asi que este
                        // boton no puede heredar el uppercase de los demas
                        i === APPS
                        ? 'normal-case'
                        : undefined
                  }
                >
                  {i === APPS ? 'APPs >>' : t(`videos.v${i}`)}
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
        <video
          ref={video}
          src={videoDe(language, videoActivo, appActiva)}
          poster={portadaDe(language, videoActivo, appActiva)}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setAnimacionLista(true)}
          onClick={alternarPanel}
          onDoubleClick={alternarPantallaCompleta}
          onEnded={() => {
            setEnPausa(true)
            if (video.current) video.current.currentTime = 0
            setTiempo(0)
          }}
          className="h-full w-full object-contain"
        />
        )}

        {!sinMedia && !animacionLista && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[18px]"
          >
            <span
              aria-hidden="true"
              className="size-[30px] animate-spin rounded-full border-[3px] border-line border-t-accent"
            />
            <span className="font-mono text-lg uppercase tracking-[0.16em] text-muted">
              {t('hero.loading')}
            </span>
          </div>
        )}
        {!sinMedia && (
        <div
            ref={panel}
            onPointerDown={empezarArrastre}
            onPointerMove={moverArrastre}
            onPointerUp={soltarArrastre}
            onPointerCancel={soltarArrastre}
            title={t('controls.drag')}
            style={{
              ...(posicionPanel === null ? {} : { top: posicionPanel, bottom: 'auto' }),
              ...(pantallaCompleta && cajaUtil
                ? { left: cajaUtil.izq, right: 'auto', width: cajaUtil.ancho }
                : {})
            }}
            className={[
              'absolute inset-x-0 z-20 select-none border-y border-line/60 bg-surface/50 px-2 py-1.5 backdrop-blur-sm',
              'cursor-ns-resize touch-none transition-opacity duration-300',
              panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
              posicionPanel === null ? 'bottom-36 sm:bottom-44' : ''
            ].join(' ')}
          >
            <div className="flex items-center justify-start gap-3">
              {(
                [
                  {
                    etiqueta: t('controls.stop'),
                    icono: <span className="block h-[0.85em] w-[0.85em] bg-current" />,
                    accion: detener
                  },
                  {
                    etiqueta: enPausa ? t('controls.play') : t('controls.pause'),
                    icono: enPausa ? (
                      <svg viewBox="0 0 10 12" fill="currentColor" className="block h-[0.85em] w-[0.72em]">
                        <path d="M0 0 10 6 0 12Z" />
                      </svg>
                    ) : (
                      <span className="flex items-center gap-[0.1em]">
                        <span className="h-[0.85em] w-[0.32em] bg-current" />
                        <span className="h-[0.85em] w-[0.32em] bg-current" />
                      </span>
                    ),
                    accion: alternarPausa
                  }
                ] as { etiqueta: string; icono: ReactNode; accion: () => void }[]
              ).map((b) => (
                <button
                  key={b.etiqueta}
                  type="button"
                  onClick={b.accion}
                  aria-label={b.etiqueta}
                  title={b.etiqueta}
                  className="cursor-pointer rounded-sm px-2 py-1 font-mono text-[2.45rem] leading-none text-crema transition-colors hover:bg-line/40 sm:text-[2.625rem]"
                >
                  {b.icono}
                </button>
              ))}
              <button
                type="button"
                onClick={siguienteVelocidad}
                aria-label={t('controls.faster')}
                title={t('controls.faster')}
                className="-ml-2 cursor-pointer rounded-sm px-2 py-1 font-mono text-[2.45rem] leading-none text-crema transition-colors hover:bg-line/40 sm:text-[2.625rem]"
              >
                {VELOCIDADES[velocidad]}x
              </button>

              <button
                type="button"
                onClick={alternarPantallaCompleta}
                aria-label={pantallaCompleta ? t('controls.exitFullscreen') : t('controls.fullscreen')}
                title={pantallaCompleta ? t('controls.exitFullscreen') : t('controls.fullscreen')}
                className="cursor-pointer rounded-sm px-2 py-1 font-mono text-[2.45rem] leading-none text-crema transition-colors hover:bg-line/40 sm:text-[2.625rem]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="block h-[0.85em] w-[0.85em]"
                >
                  {pantallaCompleta ? (
                    <>
                      <path d="M9 3v6H3" />
                      <path d="M15 3v6h6" />
                      <path d="M9 21v-6H3" />
                      <path d="M15 21v-6h6" />
                    </>
                  ) : (
                    <>
                      <path d="M3 9V3h6" />
                      <path d="M21 9V3h-6" />
                      <path d="M3 15v6h6" />
                      <path d="M21 15v6h-6" />
                    </>
                  )}
                </svg>
              </button>

              <svg
                aria-hidden="true"
                viewBox="0 0 16 46"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.1}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto h-[46px] w-[18px] shrink-0 text-crema/60"
              >
                <path d="M8 3v40" />
                <path d="M2.5 8 8 3l5.5 5" />
                <path d="M2.5 38 8 43l5.5-5" />
              </svg>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={duracion || 0}
                step={0.1}
                value={Math.min(tiempo, duracion || 0)}
                onChange={(e) => irA(Number(e.target.value))}
                aria-label={t('controls.timeline')}
                className="h-1 w-full cursor-pointer touch-auto accent-crema"
              />
              <span className="shrink-0 font-mono text-[1.3rem] leading-none tabular-nums text-muted sm:text-[1.4rem]">
                {reloj(tiempo)} / {reloj(duracion)}
              </span>
            </div>
        </div>
        )}
      </div>

      <img
        ref={logoCabecera}
        style={esEscritorio && !pantallaCompleta ? { left: borde.izq } : undefined}
        src="/logo-app-place.webp"
        alt="App Place Catalog"
        width={256}
        height={256}
        className={[
          'absolute left-0 top-0 z-10 w-16 sm:w-32',
          intro === 'fuera' ? 'opacity-100' : 'opacity-0'
        ].join(' ')}
      />

      <p
        ref={sloganCabecera}
        style={esEscritorio && !pantallaCompleta ? { left: borde.izq } : undefined}
        className={[
          'absolute left-[70px] top-[11px] z-10 whitespace-pre-line text-center font-mono text-[0.825rem] uppercase leading-relaxed tracking-[0.2em] text-crema',
          'sm:left-0 sm:top-[134px] sm:text-[0.75rem]',
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
              src="/logo-app-place.webp"
              alt=""
              width={256}
              height={256}
              style={intro === 'saliendo' ? { transform: viaje } : undefined}
              className={[
                'w-[11.5rem] [image-rendering:pixelated] sm:w-[18.4rem]',
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

      <header style={esEscritorio && !pantallaCompleta ? { left: borde.der } : undefined} className="absolute right-1 top-3 z-20 sm:right-auto sm:top-4">
        <LanguageSwitcher />
      </header>

      <footer
        ref={pie}
        style={
          esEscritorio && !pantallaCompleta
            ? { left: borde.der + SEPARACION, maxWidth: borde.ancho }
            : undefined
        } className="absolute bottom-1 left-2 z-20 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[0.7rem] tracking-[0.1em] text-muted/70 sm:bottom-2 sm:justify-start sm:text-left sm:text-xs">
        <span className="flex flex-none items-center gap-1.5 whitespace-nowrap">
          © {new Date().getFullYear()}
          <img src="/logo-ap3c.webp" alt="ap3c.app" className="h-3.5 w-auto sm:h-3" />
        </span>
        <span className="w-full whitespace-nowrap text-[0.6rem] sm:w-auto sm:whitespace-normal sm:text-xs">
          {t('footer.rights')}
        </span>
      </footer>

      <p
        style={
          esEscritorio && !pantallaCompleta
            ? { left: borde.der + SEPARACION, bottom: altoPie + 16 }
            : undefined
        }
        className="absolute bottom-1 right-1 z-10 rounded-full sm:right-auto border border-line bg-surface/60 px-3 py-1 text-center font-mono text-[0.6rem] uppercase leading-tight tracking-[0.16em] text-muted sm:right-0 sm:px-4 sm:py-[10px] sm:text-xs"
      >
        {t('hero.status')
          .split('·')
          .map((linea) => (
            <span key={linea} className="block">
              {`<${linea.trim()}>`}
            </span>
          ))}
      </p>
    </div>
  )
}
