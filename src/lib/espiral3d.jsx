import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/* ===== Simulador 3D del vertido (Laboratorio) + hero del dripper (Inicio) =====
   Vive en su propio módulo (no en App.jsx) a propósito: three.js pesa
   varios cientos de KB, y estos son dos de seis pantallas — no tiene sentido
   que ese peso bloquee la carga inicial de la app para alguien que solo
   quiere ver la Carta. App.jsx carga cada export con React.lazy()/import()
   dinámico apuntando a este mismo archivo, así que comparten un solo chunk
   (three.js no se descarga dos veces) y cada uno solo se baja cuando el
   cliente realmente abre esa pantalla. Los componentes reciben los colores
   como props (no useTheme/ThemeCtx) para no acoplarse al árbol de contexto
   de App.jsx — solo dependen de React y three. */

const ESPIRAL_TUBULAR = 160;
const ESPIRAL_RADIAL = 8;
const ESPIRAL_ESCALA = 86; // radio máximo del tubo en unidades de mundo, misma proporción que el SVG (size/2 - 14 ≈ 86)

// Modelo real del dripper (generado a partir de foto del producto real,
// comprimido con meshopt + texturas WebP de 512px — 7.2MB → 357KB). Servido
// desde public/ (no import de Vite) porque .glb no está en su lista de
// tipos de asset por defecto.
//
// Se eligió meshopt en vez de Draco a propósito: el decoder de Draco de
// three.js referencia sus archivos .wasm/.js con `new URL(..., import.meta.url)`,
// un patrón que Vite detecta en build time y empaqueta como assets propios
// — duplicados, porque lo hace tanto para la ruta "genérica" como para la
// variante "gltf/" del decoder — sin importar que en runtime siempre se
// sobreescriba esa ruta. Eso agregaba ~1MB de peso muerto (nunca se
// descarga, pero el service worker sí lo precachea). El decoder de meshopt
// va con el WASM embebido en línea dentro del propio módulo JS (~29KB), sin
// asset aparte, así que no tiene ese problema.
const DRIPPER_URL = "/models/dripper.glb";
// Escala/posición elegidas para que el diámetro del cono (real, del glb)
// coincida con el radio máximo que alcanza la espiral en su slider tope
// (radio=1 → ESPIRAL_ESCALA=86 unidades) y la espiral quede recostada
// dentro del cono, no flotando por fuera.
const DRIPPER_ESCALA = 105;
const DRIPPER_Y = -46;

function cargadorDripper() {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

// El modelo trae su propio material PBR (negro mate, facetado) — nunca se
// le toca color/emissive, solo se libera memoria al desmontar.
function disponerObjeto3D(obj) {
  obj.traverse((hijo) => {
    if (hijo.geometry) hijo.geometry.dispose();
    if (hijo.material) {
      const mats = Array.isArray(hijo.material) ? hijo.material : [hijo.material];
      mats.forEach((m) => {
        Object.values(m).forEach((v) => { if (v && v.isTexture) v.dispose(); });
        m.dispose();
      });
    }
  });
}

/* Misma fórmula que spiralPath en App.jsx (ángulo y radio lineales en t)
   pero como curva 3D en el plano XZ, para extruir con TubeGeometry. No es
   una curva nueva — es la misma matemática, solo en otro sistema de
   coordenadas. */
class EspiralCurve extends THREE.Curve {
  constructor(vueltas, radio, escala) {
    super();
    this.vueltas = vueltas;
    this.radio = radio;
    this.escala = escala;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const ang = t * this.vueltas * Math.PI * 2;
    const r = t * this.escala * this.radio;
    return target.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
  }
}

/* Escena mínima a propósito (dripper fijo + dos tubos + dos anillos guía +
   una esfera): vive dentro de un tab con sliders reactivos y no debe
   generar lag ni recalentar el teléfono. */
export default function EspiralTubo3D({ vueltas, radio, prog, colorLinea, colorBrand, colorAcento }) {
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const progRef = useRef(prog);

  useEffect(() => { progRef.current = prog; }, [prog]);

  // Monta la escena una sola vez. Todo lo que cambia después (geometría,
  // colores) se actualiza mutando estos mismos objetos, no recreándolos.
  useEffect(() => {
    const wrap = wrapRef.current;
    const tam = 210;
    let cancelado = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 1, 2000);
    // Ángulo 3/4 (ni cenital ni de perfil) para que se note el volumen del tubo.
    // Distancia con margen: a radio=1 (tope del slider) la espiral llega a
    // ESPIRAL_ESCALA=86 unidades de radio — esta posición deja aire alrededor
    // sin recortar en ningún borde.
    camera.position.set(0, 175, 340);
    camera.lookAt(0, -20, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(tam, tam);
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    const ambiental = new THREE.AmbientLight(0xffffff, 0.65);
    const sol = new THREE.DirectionalLight(0xffffff, 0.95);
    sol.position.set(70, 150, 90);
    scene.add(ambiental, sol);

    const anillo = (r) => {
      const curva = new THREE.EllipseCurve(0, 0, r, r);
      const pts = curva.getPoints(64).map((p) => new THREE.Vector3(p.x, 0, p.y));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineDashedMaterial({ dashSize: 3, gapSize: 4, transparent: true, opacity: .5 });
      const linea = new THREE.LineLoop(geo, mat);
      linea.computeLineDistances();
      scene.add(linea);
      return linea;
    };
    const anillo60 = anillo(60), anillo30 = anillo(30);

    const curva = new EspiralCurve(vueltas, radio, ESPIRAL_ESCALA);
    const geoGuia = new THREE.TubeGeometry(curva, ESPIRAL_TUBULAR, 2, ESPIRAL_RADIAL, false);
    const matGuia = new THREE.MeshStandardMaterial({ roughness: .6, transparent: true, opacity: .35 });
    const tuboGuia = new THREE.Mesh(geoGuia, matGuia);
    scene.add(tuboGuia);

    const geoActivo = new THREE.TubeGeometry(curva, ESPIRAL_TUBULAR, 2.6, ESPIRAL_RADIAL, false);
    const matActivo = new THREE.MeshStandardMaterial({ roughness: .4, emissiveIntensity: .18 });
    const tuboActivo = new THREE.Mesh(geoActivo, matActivo);
    scene.add(tuboActivo);

    const gota = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 16),
      new THREE.MeshStandardMaterial({ emissiveIntensity: 1.3, roughness: .3 }),
    );
    scene.add(gota);

    // El dripper es la base fija de la escena: sin animación propia, solo
    // presente como contenedor visual real de la espiral.
    const loader = cargadorDripper();
    let dripper = null;
    loader.load(DRIPPER_URL, (gltf) => {
      if (cancelado) return;
      dripper = gltf.scene;
      dripper.scale.setScalar(DRIPPER_ESCALA);
      dripper.position.y = DRIPPER_Y;
      scene.add(dripper);
      st.dripper = dripper;
    });

    const st = {
      scene, camera, renderer, curva, tuboGuia, tuboActivo, geoGuia, geoActivo,
      matGuia, matActivo, gota, anillo60, anillo30, dripper: null,
    };
    stateRef.current = st;

    const segIdx = ESPIRAL_RADIAL * 6; // índices por segmento tubular (ver TubeGeometry)
    let raf;
    const tick = () => {
      const p = Math.min(1, Math.max(0, progRef.current));
      const conteo = Math.min(ESPIRAL_TUBULAR, Math.ceil(ESPIRAL_TUBULAR * p)) * segIdx;
      st.geoActivo.setDrawRange(0, conteo);
      st.gota.position.copy(st.curva.getPointAt(p));
      st.renderer.render(st.scene, st.camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      geoGuia.dispose(); geoActivo.dispose();
      matGuia.dispose(); matActivo.dispose();
      gota.geometry.dispose(); gota.material.dispose();
      anillo60.geometry.dispose(); anillo60.material.dispose();
      anillo30.geometry.dispose(); anillo30.material.dispose();
      if (st.dripper) disponerObjeto3D(st.dripper);
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sliders (vueltas/radio) en tiempo real: reconstruye solo la geometría,
  // no la escena completa. El dripper no se toca — es la base fija.
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    const curva = new EspiralCurve(vueltas, radio, ESPIRAL_ESCALA);
    const nuevaGuia = new THREE.TubeGeometry(curva, ESPIRAL_TUBULAR, 2, ESPIRAL_RADIAL, false);
    const nuevaActiva = new THREE.TubeGeometry(curva, ESPIRAL_TUBULAR, 2.6, ESPIRAL_RADIAL, false);
    st.tuboGuia.geometry.dispose();
    st.tuboActivo.geometry.dispose();
    st.tuboGuia.geometry = nuevaGuia;
    st.tuboActivo.geometry = nuevaActiva;
    st.curva = curva;
    st.geoGuia = nuevaGuia;
    st.geoActivo = nuevaActiva;
  }, [vueltas, radio]);

  // Tema claro/oscuro: los materiales de la espiral reaccionan al toggle
  // sin recrear nada. El dripper conserva su propia textura/PBR siempre.
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    st.matGuia.color.set(colorLinea);
    st.matActivo.color.set(colorBrand);
    st.matActivo.emissive.set(colorBrand);
    st.gota.material.color.set(colorAcento);
    st.gota.material.emissive.set(colorAcento);
    st.anillo60.material.color.set(colorLinea);
    st.anillo30.material.color.set(colorLinea);
  }, [colorLinea, colorBrand, colorAcento]);

  return <div ref={wrapRef} style={{ width: 210, height: 210 }} aria-hidden="true" />;
}

// Radio/altura de cámara para el hero orbital — misma transformación del
// dripper (escala/posición) que en Laboratorio, solo cambia la cámara.
const HERO_RADIO_CAM = Math.hypot(190, 300);
const HERO_ALTURA_CAM = 60;
const HERO_MIRA_Y = -40;
const HERO_VUELTA_MS = 17000; // 17s por vuelta — dentro del rango 15-20s pedido

/* Hero decorativo del dripper para Inicio: mismo modelo, sin espiral, sin
   sliders, cámara orbitando sola en loop continuo. Ancho/alto vienen por
   props para que ocupe el mismo lugar que ocupaba la imagen estática. */
export function DripperHero({ width = 320, height = 220, colorFondo = "transparent" }) {
  const wrapRef = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    let cancelado = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 1, 3000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    const ambiental = new THREE.AmbientLight(0xffffff, 0.65);
    const sol = new THREE.DirectionalLight(0xffffff, 0.95);
    sol.position.set(70, 150, 90);
    // Luz de relleno desde atrás: el dripper es negro mate — sin un borde
    // iluminado se pierde contra fondos oscuros mientras la cámara orbita.
    const contraluz = new THREE.DirectionalLight(0xffffff, 0.85);
    contraluz.position.set(-90, 40, -140);
    scene.add(ambiental, sol, contraluz);

    const loader = cargadorDripper();
    const st = { scene, camera, renderer, dripper: null };
    stateRef.current = st;
    loader.load(DRIPPER_URL, (gltf) => {
      if (cancelado) return;
      const dripper = gltf.scene;
      dripper.scale.setScalar(DRIPPER_ESCALA);
      dripper.position.y = DRIPPER_Y;
      scene.add(dripper);
      st.dripper = dripper;
    });

    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const ang = ((t - t0) % HERO_VUELTA_MS) / HERO_VUELTA_MS * Math.PI * 2;
      camera.position.set(Math.sin(ang) * HERO_RADIO_CAM, HERO_ALTURA_CAM, Math.cos(ang) * HERO_RADIO_CAM);
      camera.lookAt(0, HERO_MIRA_Y, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      if (st.dripper) disponerObjeto3D(st.dripper);
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  return <div ref={wrapRef} style={{ width, height, background: colorFondo }} aria-hidden="true" />;
}
