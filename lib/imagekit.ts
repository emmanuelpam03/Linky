import ImageKit from "@imagekit/nodejs";

let imageKitClient: ImageKit | null = null;

export function getImageKitClient() {
  if (imageKitClient) {
    return imageKitClient;
  }

  const { IMAGEKIT_PRIVATE_KEY } = process.env;

  if (!IMAGEKIT_PRIVATE_KEY) {
    throw new Error("ImageKit environment variable IMAGEKIT_PRIVATE_KEY is required.");
  }

  imageKitClient = new ImageKit({
    privateKey: IMAGEKIT_PRIVATE_KEY,
  });

  return imageKitClient;
}

export default getImageKitClient;
