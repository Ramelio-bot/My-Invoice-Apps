export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  outputSize = 400,
  flip = { horizontal: false, vertical: false }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.translate(outputSize / 2, outputSize / 2);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-outputSize / 2, -outputSize / 2);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve) => {
    // 0.8 is an optimal compression quality yielding <100kb usually for a 400x400 image
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.8);
  });
}
