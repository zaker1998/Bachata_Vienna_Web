"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import type { BachataVideo, VideoLevel } from "@/lib/data";
import { cn } from "@/lib/utils";

const levelStyles: Record<VideoLevel, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-rose-100 text-rose-700",
};

interface VideoCardProps {
  video: BachataVideo;
}

export function VideoCard({ video }: VideoCardProps) {
  // Facade pattern: show a thumbnail until the user clicks play, so the page
  // doesn't load one heavy YouTube iframe per card up front.
  const [playing, setPlaying] = useState(false);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-video w-full bg-muted">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${video.title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail */}
            <img
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg transition-transform group-hover:scale-110">
              <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-snug">{video.title}</h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              levelStyles[video.level]
            )}
          >
            {video.level}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{video.description}</p>
        <a
          href={video.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-2 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          Watch on YouTube ↗ · by the original creator
        </a>
      </div>
    </article>
  );
}
