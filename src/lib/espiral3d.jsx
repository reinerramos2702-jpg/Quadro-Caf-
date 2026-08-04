import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ===== Simulador 3D del vertido (Laboratorio) =====
   Vive en su propio módulo (no en App.jsx) a propósito: three.js pesa
   varios cientos de KB, y este tab es uno de seis — no tiene sentido que
   ese peso bloquee la carga inicial de la app para alguien que solo quiere
   ver la Carta. App.jsx lo carga con React.lazy()/import() dinámico, así
   que este chunk solo se descarga cuando el cliente realmente abre
   Laboratorio. Recibe los colores como props (no useTheme/ThemeCtx) para
   no acoplarse al árbol de contexto de App.jsx — solo depende de React y
   three. */

const ESPIRAL_TUBULAR = 160;
const ESPIRAL_RADIAL = 8;
const ESPIRAL_ESCALA = 86; // radio máximo del tubo en unidades de mundo, misma proporción que el SVG (size/2 - 14 ≈ 86)

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

/* Escena mínima a propósito (dos tubos, dos anillos guía, una esfera):
   vive dentro de un tab con sliders reactivos y no debe generar lag ni
   recalentar el teléfono. */
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 1, 2000);
    // Ángulo 3/4 (ni cenital ni de perfil) para que se note el volumen del tubo.
    camera.position.set(0, 165, 150);
    camera.lookAt(0, 0, 0);

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

    const st = {
      scene, camera, renderer, curva, tuboGuia, tuboActivo, geoGuia, geoActivo,
      matGuia, matActivo, gota, anillo60, anillo30,
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
      cancelAnimationFrame(raf);
      geoGuia.dispose(); geoActivo.dispose();
      matGuia.dispose(); matActivo.dispose();
      gota.geometry.dispose(); gota.material.dispose();
      anillo60.geometry.dispose(); anillo60.material.dispose();
      anillo30.geometry.dispose(); anillo30.material.dispose();
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sliders (vueltas/radio) en tiempo real: reconstruye solo la geometría,
  // no la escena completa.
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
    st.anillo60.material.color.set(colorLinea);
    st.anillo30.material.color.set(colorLinea);
  }, [colorLinea, colorBrand, colorAcento]);

  return <div ref={wrapRef} style={{ width: 210, height: 210 }} aria-hidden="true" />;
}
