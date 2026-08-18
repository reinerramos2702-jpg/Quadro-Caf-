import sharp from "sharp";

const incoming = String.raw`C:\Users\RAI Agency\OneDrive\Documentos\RAI Agency\App's\Quadro Cafe\_incoming` + "\\";
await sharp(incoming + "file_0000000079e8820c88ca84da6815cee8.png")
  .extract({ left: 350, top: 700, width: 60, height: 60 })
  .resize(240, 240, { kernel: "nearest" })
  .toFile("scripts/_tmp_crop_check.png");
