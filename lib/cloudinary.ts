import { v2 as cloudinary } from "cloudinary";

// Server-only Cloudinary client. Configured from environment variables:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_FOLDER = "chicago-outlet/products";

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Uploads a single image (data URI, remote URL, or base64) to Cloudinary and
// returns the hosted secure URL.
export async function uploadToCloudinary(source: string): Promise<string> {
  const res = await cloudinary.uploader.upload(source, {
    folder: CLOUDINARY_FOLDER,
    resource_type: "image",
    overwrite: false,
    // Trim oversized originals and serve in an efficient format.
    transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
  });
  return res.secure_url;
}

export { cloudinary };
