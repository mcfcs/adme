export function resizeImage(file, maxSize = 1600) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file (JPG, PNG, WebP or GIF)."));
      return;
    }

    const url = URL.createObjectURL(file);
    const picture = new Image();

    picture.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(picture.width, picture.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(picture.width * scale);
      canvas.height = Math.round(picture.height * scale);

      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(picture, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    picture.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image couldn't be opened. Try another file."));
    };

    picture.src = url;
  });
}
