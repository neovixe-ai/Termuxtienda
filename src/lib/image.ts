const MAX_DIM = 900;
const QUALITY = 0.8;

/**
 * Lee un archivo de imagen y lo devuelve como data URL JPEG redimensionado
 * (máx. 900px) para no llenar el localStorage con imágenes enormes.
 */
export function fileToImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.onerror = () => reject(new Error("Formato de imagen no soportado."));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Convierte un data URL de vuelta a File para poder compartirlo con la Web Share API. */
export function dataUrlToFile(dataUrl: string, name: string): File {
  const [meta, base64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}
