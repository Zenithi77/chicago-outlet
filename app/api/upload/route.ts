import { NextResponse } from "next/server";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

// POST /api/upload
// Two modes (staff only):
//   1. multipart/form-data with one or more "files" → uploads local images
//   2. application/json { urls: string[] }          → re-hosts remote images
// Returns { urls: string[] } of Cloudinary-hosted secure URLs.
export async function POST(request: Request) {
  // Only signed-in staff may upload.
  let profile: Awaited<ReturnType<typeof getProfile>>;
  try {
    profile = await getProfile();
  } catch {
    return NextResponse.json({ error: "Нэвтрэлт шалгах үед алдаа гарлаа." }, { status: 500 });
  }
  if (!isStaff(profile?.role)) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй." }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary тохиргоо дутуу байна (.env.local шалгана уу)." },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    // Mode 2: re-host remote URLs (e.g. images fetched from a barcode lookup).
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { urls?: unknown };
      const urls = Array.isArray(body.urls)
        ? body.urls.filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
        : [];
      if (urls.length === 0) {
        return NextResponse.json({ error: "URL олдсонгүй." }, { status: 400 });
      }
      const hosted = await Promise.all(urls.slice(0, 8).map((u) => uploadToCloudinary(u)));
      return NextResponse.json({ urls: hosted });
    }

    // Mode 1: local file uploads.
    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "Файл олдсонгүй." }, { status: 400 });
    }

    const hosted: string[] = [];
    for (const file of files.slice(0, 8)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `${file.name}: зураг 10MB-ээс хэтэрсэн.` },
          { status: 413 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
      hosted.push(await uploadToCloudinary(dataUri));
    }

    if (hosted.length === 0) {
      return NextResponse.json({ error: "Зурган файл олдсонгүй." }, { status: 400 });
    }
    return NextResponse.json({ urls: hosted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Хадгалах үед алдаа гарлаа.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
