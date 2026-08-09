import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/* ===== Simulador 3D de la espiral (Laboratorio + comparador de rutas en
   Inicio) + hero orbital de Inicio =====
   Vive en su propio módulo (no en App.jsx) a propósito: three.js pesa
   varios cientos de KB — no tiene sentido acoplar ese peso al resto de la
   app en un solo archivo. Los componentes reciben los colores como props
   (no useTheme/ThemeCtx) para no acoplarse al árbol de contexto de
   App.jsx — solo dependen de React y three.

   Adaptado de un componente equivalente escrito en una sesión anterior
   para un modelo distinto ("dripper.glb", nunca llegó a esta rama). Misma
   fórmula de curva y misma técnica de tubo revelado progresivamente; lo
   que SÍ cambia es cómo se ubica el modelo real: en vez de escala/posición
   fijas a mano (afinadas a ojo para ese otro archivo, con Playwright, en
   un entorno que aquí no está disponible), este módulo calcula la caja
   contenedora del modelo cargado y lo centra/escala automáticamente
   (encuadrarModelo) — funciona sin importar las unidades/pivote reales de
   `espiral.glb`, que no se pudieron inspeccionar visualmente antes de
   escribir esto. */

const ESPIRAL_TUBULAR = 160;
const ESPIRAL_RADIAL = 8;
// Mismo radio máximo que ya usan spiralPath/Ticket en App.jsx (86 = size/2 - 14
// del viewBox 200x200 de las espirales SVG que esto reemplaza) — no es un
// número nuevo, es el que ya regía la versión plana.
const ESPIRAL_ESCALA = 86;

// public/models/espiral.glb — el mismo modelo que ya usaba <model-viewer> en
// Lab (y ahora también en el hero de Inicio). No es un asset nuevo.
const MODELO_URL = "/models/espiral.glb";
// Radio objetivo (en las mismas unidades de mundo que ESPIRAL_ESCALA) al que
// se escala el modelo cargado, sea cual sea su tamaño real — ver
// encuadrarModelo(). Un poco mayor que el radio máximo de la espiral para
// que el modelo la enmarque en vez de quedar más chico que ella.
const MODELO_RADIO_OBJETIVO = ESPIRAL_ESCALA * 1.15;

function cargadorEspiral() {
  return new GLTFLoader();
}

// El modelo trae su propio material — nunca se le toca color/emissive, solo
// se libera memoria al desmontar.
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

// Centra el objeto en el origen y lo escala para que su radio (mitad de la
// diagonal mayor de su caja contenedora) coincida con `radioObjetivo` —
// así el modelo se ve consistente sin depender de sus unidades/pivote
// originales, que no se pudieron verificar visualmente en este entorno.
function encuadrarModelo(objeto, radioObjetivo) {
  const caja = new THREE.Box3().setFromObject(objeto);
  const centro = caja.getCenter(new THREE.Vector3());
  const tam = caja.getSize(new THREE.Vector3());
  const radioActual = Math.max(tam.x, tam.y, tam.z) / 2 || 1;
  const escala = radioObjetivo / radioActual;
  objeto.scale.setScalar(escala);
  objeto.position.set(-centro.x * escala, -centro.y * escala, -centro.z * escala);
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

function crearLuces(scene, { contraluz = false } = {}) {
  const ambiental = new THREE.AmbientLight(0xffffff, 0.7);
  const sol = new THREE.DirectionalLight(0xffffff, 1.05);
  sol.position.set(70, 150, 90);
  scene.add(ambiental, sol);
  if (contraluz) {
    // Luz de relleno desde atrás — sin esto un modelo oscuro se pierde
    // contra un fondo oscuro. Ver punto 4 del pedido: el hero se veía
    // demasiado tenue en ambos temas.
    const rim = new THREE.DirectionalLight(0xffffff, 1.1);
    rim.position.set(-90, 60, -140);
    scene.add(rim);
  }
  return { ambiental, sol };
}

/**
 * Simulador interactivo: modelo real (espiral.glb) como base fija + tubo
 * procedural que se reconstruye con vueltas/radio y se revela con `prog`
 * (0→1). Reemplaza tanto el <model-viewer> decorativo como el SVG plano
 * que antes vivían por separado en Laboratorio — ahora es un solo elemento
 * que además reutiliza el comparador de rutas en Inicio (props distintas,
 * mismo componente).
 */
export default function EspiralTubo3D({ vueltas, radio, prog, colorLinea, colorBrand, colorAcento, tam = 210 }) {
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const progRef = useRef(prog);

  useEffect(() => { progRef.current = prog; }, [prog]);

  useEffect(() => {
    const wrap = wrapRef.current;
    let cancelado = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 1, 2000);
    // Ángulo 3/4 (ni cenital ni de perfil) para que se note el volumen del
    // tubo, con margen de sobra respecto al radio máximo de la espiral
    // (86 unidades) para no recortar bordes en ningún ángulo.
    camera.position.set(0, 175, 340);
    camera.lookAt(0, -20, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(tam, tam);
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    crearLuces(scene);

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

    const loader = cargadorEspiral();
    let modelo = null;
    loader.load(MODELO_URL, (gltf) => {
      if (cancelado) return;
      modelo = gltf.scene;
      encuadrarModelo(modelo, MODELO_RADIO_OBJETIVO);
      scene.add(modelo);
      st.modelo = modelo;
    });

    const st = {
      scene, camera, renderer, curva, tuboGuia, tuboActivo, geoGuia, geoActivo,
      matGuia, matActivo, gota, modelo: null,
    };
    stateRef.current = st;

    const segIdx = ESPIRAL_RADIAL * 6; // índices por segmento tubular (ver TubeGeometry)
    let raf;
    const tick = () => {
      const p = Math.min(1, Math.max(0, progRef.current));
      const conteo = Math.min(ESPIRAL_TUBULAR, Math.ceil(ESPIRAL_TUBULAR * p)) * segIdx;
      st.geoActivo.setDrawRange(0, conteo);
      st.gota.position.copy(st.curva.getPointAt(Math.max(0.001, p)));
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
      if (st.modelo) disponerObjeto3D(st.modelo);
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tam]);

  // Sliders (vueltas/radio) en tiempo real: reconstruye solo la geometría
  // del tubo, no la escena completa. El modelo base no se toca.
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

  // Tema claro/oscuro: los materiales reaccionan al toggle sin recrear nada.
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    st.matGuia.color.set(colorLinea);
    st.matActivo.color.set(colorBrand);
    st.matActivo.emissive.set(colorBrand);
    st.gota.material.color.set(colorAcento);
    st.gota.material.emissive.set(colorAcento);
  }, [colorLinea, colorBrand, colorAcento]);

  return <div ref={wrapRef} style={{ width: tam, height: tam }} aria-hidden="true" />;
}

const HERO_VUELTA_MS = 17000; // 17s por vuelta de cámara

/* Hero decorativo de Inicio: mismo modelo + la espiral completamente
   revelada (con brillo de marca, no solo el modelo apagado) orbitando
   sola, sin sliders ni interacción. La espiral encendida es a propósito
   la parte que le da presencia al hero (punto 4 del pedido: el modelo
   solo, sin ella, se perdía contra el fondo en ambos temas) — junto con
   luz de relleno trasera para que el modelo no se pierda contra fondos
   oscuros. */
export function EspiralHero({ vueltas = 4.2, radio = 1, colorLinea, colorBrand, colorAcento, width = 320, height = 300 }) {
  const wrapRef = useRef(null);

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

    crearLuces(scene, { contraluz: true });

    const curva = new EspiralCurve(vueltas, radio, ESPIRAL_ESCALA);
    const geoActivo = new THREE.TubeGeometry(curva, ESPIRAL_TUBULAR, 2.8, ESPIRAL_RADIAL, false);
    const matActivo = new THREE.MeshStandardMaterial({ roughness: .35, emissiveIntensity: .55 });
    matActivo.color.set(colorBrand);
    matActivo.emissive.set(colorBrand);
    const tubo = new THREE.Mesh(geoActivo, matActivo);
    scene.add(tubo);

    const gota = new THREE.Mesh(
      new THREE.SphereGeometry(4.5, 16, 16),
      new THREE.MeshStandardMaterial({ emissiveIntensity: 1.4, roughness: .3 }),
    );
    gota.material.color.set(colorAcento);
    gota.material.emissive.set(colorAcento);
    gota.position.copy(curva.getPointAt(1));
    scene.add(gota);
    void colorLinea; // guía apagada no se muestra en el hero — solo el tubo con brillo

    const loader = cargadorEspiral();
    let modelo = null;
    loader.load(MODELO_URL, (gltf) => {
      if (cancelado) return;
      modelo = gltf.scene;
      encuadrarModelo(modelo, MODELO_RADIO_OBJETIVO);
      scene.add(modelo);
    });

    const radioCam = Math.hypot(190, 300);
    const alturaCam = 90;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const ang = ((t - t0) % HERO_VUELTA_MS) / HERO_VUELTA_MS * Math.PI * 2;
      camera.position.set(Math.sin(ang) * radioCam, alturaCam, Math.cos(ang) * radioCam);
      camera.lookAt(0, -10, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      geoActivo.dispose(); matActivo.dispose();
      gota.geometry.dispose(); gota.material.dispose();
      if (modelo) disponerObjeto3D(modelo);
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, vueltas, radio, colorLinea, colorBrand, colorAcento]);

  return <div ref={wrapRef} style={{ width, height }} aria-hidden="true" />;
}
