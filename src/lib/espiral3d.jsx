import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ===== Simulador 3D de la espiral (Laboratorio + comparador de rutas en
   Inicio) + hero orbital de Inicio =====
   Vive en su propio módulo (no en App.jsx) a propósito: three.js pesa
   varios cientos de KB — no tiene sentido acoplar ese peso al resto de la
   app en un solo archivo. Los componentes reciben los colores como props
   (no useTheme/ThemeCtx) para no acoplarse al árbol de contexto de
   App.jsx — solo dependen de React y three.

   Tres cosas que se habían perdido y aquí vuelven (el dueño reportó el
   modelo "pequeño, empujado hacia abajo, casi saliéndose del cono" y sin
   el detalle que tenía antes):

   1) ENTORNO DE ILUMINACIÓN. El material del .glb es PBR con
      metallicRoughness real. Con luces direccionales solamente, un
      material así no tiene nada que reflejar y se apaga hasta quedar en
      negro plano — que es exactamente lo que se veía. La versión buena
      pasaba por <model-viewer>, que SIEMPRE monta un entorno IBL neutro
      más tone mapping; aquí eso hay que pedirlo explícitamente
      (PMREMGenerator + RoomEnvironment + ACESFilmic). Es lo que devuelve
      el relieve y los brillos de las aristas del cono.

   2) ENCUADRE. Antes se escalaba el modelo por su dimensión MAYOR y se
      centraba en el origen, con la espiral en y=0: como el cono es mucho
      más ancho que alto, quedaba chico, y su "media altura" cae por
      debajo de la boca — así que la espiral aparecía abrazando el cono
      por fuera, cerca de la punta. Ahora el encuadre se deriva del propio
      modelo: se escala por su RADIO HORIZONTAL, y la espiral se dibuja en
      el plano de la boca (ESPIRAL_Y), con un radio máximo que cabe dentro
      del cono a esa altura.

   3) GUÍAS PUNTEADAS. Los anillos de referencia (líneas discontinuas en
      color de línea) existían y se borraron en el último pase; se
      restauran, y además la ruta completa de la espiral se dibuja como
      línea punteada sobre el tubo, que es lo que se leía como los puntos
      claros a lo largo del recorrido. */

const ESPIRAL_TUBULAR = 160;
const ESPIRAL_RADIAL = 8;

// Radio horizontal al que se escala el modelo, en unidades de mundo. Todo
// lo demás (altura del cono, plano de la espiral, cámara) se deriva de
// este número y de la caja real del .glb — no hay medidas sueltas.
const MODELO_RADIO = 92;
// Radio máximo de la espiral. Tiene que ser menor que el radio del cono a
// la altura ESPIRAL_Y para que la ruta quede DENTRO de la boca y no la
// desborde ni al tope del slider de radio.
const ESPIRAL_ESCALA = 58;
// Altura del plano de la espiral, como fracción de la media altura del
// modelo: 0 = centro del cono (donde estaba, y por eso la ruta salía por
// las paredes), 1 = borde de la boca. .75 la apoya dentro de la boca, con
// pared de sobra alrededor incluso con el slider de radio al tope.
const ESPIRAL_Y_REL = 0.75;

// public/models/espiral.glb — el cono real del dripper (una sola malla
// texturizada, sin espiral propia: la espiral siempre fue procedural).
const MODELO_URL = "/models/espiral.glb";

// Elevación de cámara. Baja (~27°, la que había) mira el cono casi de
// perfil y esconde la boca, que es donde vive la espiral; ~50° es el
// ángulo desde el que se ve el recorrido completo dentro del cono.
const CAM_ELEVACION = (50 * Math.PI) / 180;
const CAM_DISTANCIA = 320;

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

/* Entorno IBL neutro: sin esto el material PBR del .glb no tiene nada que
   reflejar y se ve negro plano (ver punto 1 arriba). Se genera una vez por
   renderer y se devuelve para poder liberarlo al desmontar. */
function montarEntorno(renderer, scene) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = entorno.texture;
  // A intensidad plena el entorno convierte el cono negro mate en plata
  // pulida y le lava el verde al tubo. .4 deja el reflejo justo en las
  // aristas, que es lo que le devuelve el relieve sin cambiarle el color.
  scene.environmentIntensity = .4;
  pmrem.dispose();
  return entorno;
}

// Escala el modelo por su radio horizontal (no por su dimensión mayor) y
// lo centra. Devuelve la altura de la boca en unidades de mundo, que es
// donde se apoya la espiral.
function encuadrarModelo(objeto, radioObjetivo) {
  const caja = new THREE.Box3().setFromObject(objeto);
  const centro = caja.getCenter(new THREE.Vector3());
  const tam = caja.getSize(new THREE.Vector3());
  const radioActual = Math.max(tam.x, tam.z) / 2 || 1;
  const escala = radioObjetivo / radioActual;
  objeto.scale.setScalar(escala);
  objeto.position.set(-centro.x * escala, -centro.y * escala, -centro.z * escala);
  return (tam.y * escala) / 2;
}

// El cono se abre hacia arriba, así que su masa visible queda por encima
// del origen: mirar un poco más alto lo baja en cuadro y lo deja centrado
// dentro del contenedor en vez de pegado al borde superior.
const CAM_MIRA_Y = 14;

function ubicarCamara(camera, distancia = CAM_DISTANCIA) {
  camera.position.set(0, Math.sin(CAM_ELEVACION) * distancia, Math.cos(CAM_ELEVACION) * distancia);
  camera.lookAt(0, CAM_MIRA_Y, 0);
}

/* Misma fórmula que spiralPath en App.jsx (ángulo y radio lineales en t)
   pero como curva 3D en el plano XZ, para extruir con TubeGeometry. No es
   una curva nueva — es la misma matemática, solo en otro sistema de
   coordenadas, elevada al plano de la boca del cono. */
class EspiralCurve extends THREE.Curve {
  constructor(vueltas, radio, escala, altura = 0) {
    super();
    this.vueltas = vueltas;
    this.radio = radio;
    this.escala = escala;
    this.altura = altura;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const ang = t * this.vueltas * Math.PI * 2;
    const r = t * this.escala * this.radio;
    return target.set(Math.cos(ang) * r, this.altura, Math.sin(ang) * r);
  }
}

function crearLuces(scene, { contraluz = false } = {}) {
  // Ambiental baja a propósito: el relleno ahora lo pone el entorno IBL
  // (montarEntorno). Con la ambiental que había antes, sumada al entorno,
  // todo quedaba sobreexpuesto.
  const ambiental = new THREE.AmbientLight(0xffffff, 0.25);
  const sol = new THREE.DirectionalLight(0xffffff, 0.8);
  sol.position.set(70, 150, 90);
  scene.add(ambiental, sol);
  if (contraluz) {
    // Luz de relleno desde atrás — sin esto un modelo oscuro se pierde
    // contra un fondo oscuro.
    const rim = new THREE.DirectionalLight(0xffffff, 1.1);
    rim.position.set(-90, 60, -140);
    scene.add(rim);
  }
  return { ambiental, sol };
}

// Anillos de referencia del lecho, en línea discontinua — el "papel
// milimetrado" sobre el que se lee la ruta. Estaban en la versión buena y
// se habían borrado.
function crearAnillo(scene, r, altura) {
  const curva = new THREE.EllipseCurve(0, 0, r, r);
  const pts = curva.getPoints(64).map((p) => new THREE.Vector3(p.x, altura, p.y));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({ dashSize: 3, gapSize: 4, transparent: true, opacity: .55 });
  const linea = new THREE.LineLoop(geo, mat);
  linea.computeLineDistances();
  scene.add(linea);
  return linea;
}

// Ruta punteada a lo largo de TODA la espiral, ligeramente por encima del
// tubo: son los puntos claros que se ven corriendo sobre el recorrido.
function geometriaRuta(curva) {
  const pts = curva.getPoints(ESPIRAL_TUBULAR).map((p) => new THREE.Vector3(p.x, p.y + 3.2, p.z));
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/**
 * Simulador interactivo: modelo real (espiral.glb) como base fija + tubo
 * procedural que se reconstruye con vueltas/radio y se revela con `prog`
 * (0→1), dibujado dentro de la boca del cono.
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
    ubicarCamara(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(tam, tam);
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    const entorno = montarEntorno(renderer, scene);
    crearLuces(scene);

    // Altura provisional: el .glb llega asíncrono, así que la escena se
    // arma en y=0 y se sube al plano de la boca cuando el modelo carga.
    const curva = new EspiralCurve(vueltas, radio, ESPIRAL_ESCALA, 0);

    const geoGuia = new THREE.TubeGeometry(curva, ESPIRAL_TUBULAR, 2, ESPIRAL_RADIAL, false);
    const matGuia = new THREE.MeshStandardMaterial({ roughness: .6, transparent: true, opacity: .35 });
    const tuboGuia = new THREE.Mesh(geoGuia, matGuia);
    scene.add(tuboGuia);

    const geoActivo = new THREE.TubeGeometry(curva, ESPIRAL_TUBULAR, 2.6, ESPIRAL_RADIAL, false);
    const matActivo = new THREE.MeshStandardMaterial({ roughness: .4, emissiveIntensity: .18 });
    const tuboActivo = new THREE.Mesh(geoActivo, matActivo);
    scene.add(tuboActivo);

    const matRuta = new THREE.LineDashedMaterial({ dashSize: 2.5, gapSize: 5, transparent: true, opacity: .9 });
    const ruta = new THREE.Line(geometriaRuta(curva), matRuta);
    ruta.computeLineDistances();
    scene.add(ruta);

    const anillos = [crearAnillo(scene, ESPIRAL_ESCALA * .72, 0), crearAnillo(scene, ESPIRAL_ESCALA * .36, 0)];

    const gota = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 16),
      new THREE.MeshStandardMaterial({ emissiveIntensity: 1.3, roughness: .3 }),
    );
    scene.add(gota);

    // Últimos valores de los sliders, para poder rearmar la curva cuando
    // el .glb termine de cargar (llega asíncrono, después de este efecto).
    const vueltasRef = { current: vueltas };
    const radioRef = { current: radio };

    const loader = cargadorEspiral();
    let modelo = null;
    loader.load(MODELO_URL, (gltf) => {
      if (cancelado) return;
      modelo = gltf.scene;
      const mediaAltura = encuadrarModelo(modelo, MODELO_RADIO);
      scene.add(modelo);
      st.modelo = modelo;
      // Ahora sí se conoce la boca del cono: sube todo lo procedural a ese
      // plano, en vez de dejarlo flotando en el centro del cono.
      st.altura = mediaAltura * ESPIRAL_Y_REL;
      st.reconstruir(vueltasRef.current, radioRef.current);
      anillos.forEach((a) => { a.position.y = st.altura; });
    });

    const st = {
      scene, camera, renderer, curva, tuboGuia, tuboActivo, ruta, matRuta,
      matGuia, matActivo, gota, anillos, modelo: null, entorno, altura: 0,
      reconstruir(v, r) {
        const nueva = new EspiralCurve(v, r, ESPIRAL_ESCALA, st.altura);
        st.tuboGuia.geometry.dispose();
        st.tuboActivo.geometry.dispose();
        st.ruta.geometry.dispose();
        st.tuboGuia.geometry = new THREE.TubeGeometry(nueva, ESPIRAL_TUBULAR, 2, ESPIRAL_RADIAL, false);
        st.tuboActivo.geometry = new THREE.TubeGeometry(nueva, ESPIRAL_TUBULAR, 2.6, ESPIRAL_RADIAL, false);
        st.ruta.geometry = geometriaRuta(nueva);
        st.ruta.computeLineDistances();
        st.curva = nueva;
      },
    };
    stateRef.current = st;
    st.refs = { vueltasRef, radioRef };

    const segIdx = ESPIRAL_RADIAL * 6; // índices por segmento tubular (ver TubeGeometry)
    let raf;
    const tick = () => {
      const p = Math.min(1, Math.max(0, progRef.current));
      const conteo = Math.min(ESPIRAL_TUBULAR, Math.ceil(ESPIRAL_TUBULAR * p)) * segIdx;
      st.tuboActivo.geometry.setDrawRange(0, conteo);
      st.gota.position.copy(st.curva.getPointAt(Math.max(0.001, p)));
      st.renderer.render(st.scene, st.camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      st.tuboGuia.geometry.dispose(); st.tuboActivo.geometry.dispose(); st.ruta.geometry.dispose();
      matGuia.dispose(); matActivo.dispose(); matRuta.dispose();
      anillos.forEach((a) => { a.geometry.dispose(); a.material.dispose(); });
      gota.geometry.dispose(); gota.material.dispose();
      if (st.modelo) disponerObjeto3D(st.modelo);
      entorno.dispose();
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
    st.refs.vueltasRef.current = vueltas;
    st.refs.radioRef.current = radio;
    st.reconstruir(vueltas, radio);
  }, [vueltas, radio]);

  // Tema claro/oscuro: los materiales reaccionan al toggle sin recrear nada.
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    st.matGuia.color.set(colorLinea);
    st.matRuta.color.set(colorLinea);
    st.anillos.forEach((a) => a.material.color.set(colorLinea));
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
   sola, sin sliders ni interacción. Mismo encuadre e iluminación que el
   simulador, solo cambia que la cámara gira. */
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

    const entorno = montarEntorno(renderer, scene);
    crearLuces(scene, { contraluz: true });

    const curva = new EspiralCurve(vueltas, radio, ESPIRAL_ESCALA, 0);
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
      const mediaAltura = encuadrarModelo(modelo, MODELO_RADIO);
      scene.add(modelo);
      // El tubo del hero también sube al plano de la boca.
      const altura = mediaAltura * ESPIRAL_Y_REL;
      tubo.position.y = altura;
      gota.position.y = altura;
    });

    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const ang = ((t - t0) % HERO_VUELTA_MS) / HERO_VUELTA_MS * Math.PI * 2;
      const r = Math.cos(CAM_ELEVACION) * CAM_DISTANCIA;
      camera.position.set(Math.sin(ang) * r, Math.sin(CAM_ELEVACION) * CAM_DISTANCIA, Math.cos(ang) * r);
      camera.lookAt(0, CAM_MIRA_Y, 0);
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
      entorno.dispose();
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, vueltas, radio, colorLinea, colorBrand, colorAcento]);

  return <div ref={wrapRef} style={{ width, height }} aria-hidden="true" />;
}
