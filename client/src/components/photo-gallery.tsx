import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoGalleryProps {
  photos: string[];
  neighborhoodName: string;
}

export function PhotoGallery({ photos, neighborhoodName }: PhotoGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!photos || photos.length === 0) return null;

  const prev = () => setLightbox((i) => (i! > 0 ? i! - 1 : photos.length - 1));
  const next = () => setLightbox((i) => (i! < photos.length - 1 ? i! + 1 : 0));

  return (
    <>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Photos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.slice(0, 6).map((src, idx) => (
            <button
              key={idx}
              onClick={() => setLightbox(idx)}
              className="relative aspect-[4/3] overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img
                src={src}
                alt={`${neighborhoodName} photo ${idx + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 text-white hover:text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <img
            src={photos[lightbox]}
            alt={`${neighborhoodName} photo ${lightbox + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 text-white hover:text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
