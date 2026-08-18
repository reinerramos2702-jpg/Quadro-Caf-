import sharp from "sharp";

const dir = String.raw`C:\Users\RAI Agency\OneDrive\Documentos\RAI Agency\App's\Quadro Cafe\_incoming\`;
const files = [
  "file_00000000341481f59002032dfee9559f.png",
  "file_0000000079e8820c88ca84da6815cee8.png",
  "file_00000000ccd081f59175b271236ce461.png",
  "file_00000000d1ec822fb801399454b5db1b.png",
  "file_00000000dfd081f5bdb018ce02f5c0a5.png",
];

for (const f of files) {
  const m = await sharp(dir + f).metadata();
  console.log(f, m.width, m.height, m.format, m.size);
}
