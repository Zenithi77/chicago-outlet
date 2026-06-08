"use client";

import { useRef, useState, useTransition } from "react";
import { uploadHeroImage, saveHeroUrl, type HeroKey } from "./actions";
import { UploadIcon, CloseIcon } from "@/components/Icons";
import { classNames } from "@/lib/utils";

const SLOTS: { key: HeroKey; label: string; sub: string }[] = [
  { key: "hero_park_od", label: "Park-Od Mall", sub: "Дэлгүүрийн зураг" },
  { key: "hero_riveria", label: "Parko Riveria", sub: "Дэлгүүрийн зураг" },
  { key: "hero_online",  label: "Захиалга / Онлайн", sub: "Захиалгын баннер зураг" },
];

function HeroSlot({
  slot,
  initialUrl,
}: {
  slot: (typeof SLOTS)[number];
  initialUrl: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const notify = (ok: boolean, msg?: string) => {
    setError(ok ? null : (msg ?? "Алдаа гарлаа."));
    setSuccess(ok);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleFile = (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await uploadHeroImage(slot.key, fd);
      if (res.error) return notify(false, res.error);
      setUrl(res.url!);
      notify(true);
    });
  };

  const handleUrlSave = () => {
    if (!urlInput.trim()) return;
    startTransition(async () => {
      const res = await saveHeroUrl(slot.key, urlInput.trim());
      if (res.error) return notify(false, res.error);
      setUrl(urlInput.trim());
      setUrlInput("");
      notify(true);
    });
  };

  return (
    <div className="rounded-xl border bg-surface p-5 space-y-4">
      <div>
        <p className="font-semibold text-sm">{slot.label}</p>
        <p className="text-xs text-muted">{slot.sub}</p>
      </div>

      {/* Preview */}
      <div className="relative aspect-[3/4] w-40 overflow-hidden rounded-lg border bg-background">
        {url ? (
          <>
            <img src={url} alt={slot.label} className="h-full w-full object-cover" />
            <button
              onClick={() => {
                startTransition(async () => {
                  const res = await saveHeroUrl(slot.key, "");
                  if (!res.error) setUrl("");
                });
              }}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
              title="Зураг устгах"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
            <UploadIcon className="h-8 w-8 opacity-40" />
            <span className="text-xs">Зураг байхгүй</span>
          </div>
        )}
      </div>

      {/* File upload */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={classNames(
            "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition",
            pending ? "opacity-50 cursor-not-allowed" : "hover:bg-background"
          )}
        >
          <UploadIcon className="h-4 w-4" />
          {pending ? "Ачааллаж байна…" : "Файл сонгох"}
        </button>
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://... URL оруулах"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={handleUrlSave}
          disabled={pending || !urlInput.trim()}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:opacity-80"
        >
          Хадгалах
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">✓ Амжилттай хадгалагдлаа.</p>}
    </div>
  );
}

export function HeroSettingsClient({
  settings,
}: {
  settings: Record<string, string>;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Нүүр хуудасны баннер</h1>
        <p className="mt-1 text-sm text-muted">
          3 салбарын баннер зургийг доороос удирдана. Файл upload хийх эсвэл гадаад URL ашиглана.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SLOTS.map((slot) => (
          <HeroSlot
            key={slot.key}
            slot={slot}
            initialUrl={settings[slot.key] ?? ""}
          />
        ))}
      </div>
    </div>
  );
}
