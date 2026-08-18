import sharp from "sharp";
import { statSync } from "fs";

const incoming = String.raw`C:\Users\RAI Agency\OneDrive\Documentos\RAI Agency\App's\Quadro Cafe\_incoming` + "\\";
const outDir = "src/assets/";

const mapa = [
  { src: "file_00000000341481f59002032dfee9559f.png", out: "taza-blanca.jpg" },
  { src: "file_0000000079e8820c88ca84da6815cee8.png", out: "taza-azul-marino.jpg" },
  { src: "file_00000000ccd081f59175b271236ce461.png", out: "taza-verde-bosque.jpg" },
  { src: "file_00000000d1ec822fb801399454b5db1b.png", out: "taza-terracota.jpg" },
  { src: "file_00000000dfd081f5bdb018ce02f5c0a5.png", out: "taza-roja.jpg" },
];

for (const { src, out } of mapa) {
  const input = incoming + src;
  const outPath = outDir + out;
  await sharp(input)
    .resize(480, 480, { fit: "cover" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outPath);

  // Muestra de color real del cuerpo de la taza (no el fondo, no el interior
  // blanco, no el brillo del asa): un cuadrado de 30x30px centrado un poco
  // a la izquierda y abajo del centro, zona de cerámica lisa en las 5 fotos.
  const { data, info } = await sharp(input)
    .extract({ left: 250, top: 830, width: 60, height: 60 })
    .resize(1, 1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

  const stat = await sharp(outPath).metadata();
  console.log(out, "->", hex, `(${stat.width}x${stat.height}, ${(stat.size / 1024).toFixed(1)}KB)`);
}
