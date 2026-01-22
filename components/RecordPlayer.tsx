"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Track = { title: string; src: string };

export default function RecordPlayer({
  tracks,
  initialIndex = 0,
  initialVolume = 0.25,
  autoNext = true,
}: {
  tracks: Track[];
  initialIndex?: number;
  initialVolume?: number;
  autoNext?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const safeTracks = tracks?.length ? tracks : [{ title: "No track", src: "" }];

  const [idx, setIdx] = useState(() => Math.max(0, Math.min(initialIndex, safeTracks.length - 1)));
  const track = safeTracks[idx];

  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);

  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  // keep volume synced
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  // when track changes: load + optionally autoplay if it was playing
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    setCur(0);
    setDur(0);

    // force reload metadata
    a.load();

    if (playing && track.src) {
      a.play().catch(() => {
        setPlaying(false);
      });
    }
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async () => {
    const a = audioRef.current;
    if (!a || !track.src) return;

    try {
      if (a.paused) {
        a.volume = volume;
        await a.play();
        setPlaying(true);
      } else {
        a.pause();
        setPlaying(false);
      }
    } catch {
      setPlaying(false);
    }
  };

  const prev = () => {
    setIdx((i) => (i - 1 + safeTracks.length) % safeTracks.length);
  };

  const next = () => {
    setIdx((i) => (i + 1) % safeTracks.length);
  };

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.max(0, Math.min(dur, p * dur));
    setCur(a.currentTime);
  };

  return (
    <div className="rp">
      {/* click deck to play/pause */}
      <div
        className={`rp-deck ${playing ? "is-playing" : ""}`}
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") toggle();
          if (e.key === "ArrowLeft") prev();
          if (e.key === "ArrowRight") next();
        }}
      >
        <div className="rp-plate">
          <div className="rp-vinyl">
            <div className="rp-grooves" />
            <div className="rp-label">
              <div className="rp-dot" />
            </div>
          </div>
        </div>

        <div className="rp-arm">
          <div className="rp-arm-head" />
          <div className="rp-arm-stick" />
        </div>

        <div className="rp-screw s1" />
        <div className="rp-screw s2" />
        <div className="rp-screw s3" />
        <div className="rp-screw s4" />
      </div>

      {/* controls under vinyl */}
      <div className="rp-controls">
        <button className="rp-btn" onClick={prev} type="button" aria-label="previous">
          ‹
        </button>

        <button className="rp-play" onClick={toggle} type="button">
          <div className="rp-play-top">{playing ? "pause" : "play"}</div>
          <div className="rp-play-icon">{playing ? "❚❚" : "▶"}</div>
        </button>

        <button className="rp-btn" onClick={next} type="button" aria-label="next">
          ›
        </button>

        <div className="rp-info">
          <div className="rp-title">{track.title}</div>

          <div className="rp-time">
            <span>{fmt(cur)}</span>
            <span>{fmt(dur)}</span>
          </div>

          <div className="rp-progress" onClick={onSeek}>
            <div className="rp-progress-fill" style={{ width: `${dur ? (cur / dur) * 100 : 0}%` }} />
          </div>

          <div className="rp-queue">
            <span className="rp-queue-pill">
              {idx + 1}/{safeTracks.length}
            </span>
          </div>
        </div>

        <div className="rp-volbox">
          <div className="rp-vol-label">vol</div>
          <input
            className="rp-vol-range"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <div className="rp-vol-pct">{Math.round(volume * 100)}%</div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={track.src}
        preload="auto"
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (!a) return;
          setDur(a.duration || 0);
        }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (!a) return;
          setCur(a.currentTime || 0);
        }}
        onEnded={() => {
          setPlaying(false);
          if (autoNext && safeTracks.length > 1) {
            // маленькая пауза чтобы выглядело приятнее
            setTimeout(() => next(), 250);
            setTimeout(() => setPlaying(true), 260);
          }
        }}
      />
    </div>
  );
}
