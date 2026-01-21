"use client";

import React, { useEffect, useRef, useState } from "react";

export default function RecordPlayer({
  src,
  title = "Sab’s song",
  initialVolume = 0.25,
}: {
  src: string;
  title?: string;
  initialVolume?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);

  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const fmt = (s: number) => {
    if (!isFinite(s) || s <= 0) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;

    try {
      if (a.paused) {
        a.volume = volume;
        await a.play();
        setPlaying(true);
      } else {
        a.pause();
        setPlaying(false);
      }
    } catch {}
  };

return (
  <div className="rp">
    {/* DECK */}
    <div
      className={`rp-deck ${playing ? "is-playing" : ""}`}
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") toggle();
      }}
      aria-label={playing ? "pause" : "play"}
      title={playing ? "pause" : "play"}
    >
      {/* plate */}
      <div className="rp-plate">
        <div className="rp-vinyl">
          <div className="rp-grooves" />
          <div className="rp-label">
            <div className="rp-dot" />
          </div>
        </div>
      </div>

      {/* tonearm */}
      <div className="rp-arm">
        <div className="rp-arm-head" />
        <div className="rp-arm-stick" />
      </div>

      {/* screws */}
      <div className="rp-screw s1" />
      <div className="rp-screw s2" />
      <div className="rp-screw s3" />
      <div className="rp-screw s4" />
    </div>

    {/* CONTROLS UNDER VINYL */}
    <div className="rp-controls">
      <button
        className="rp-play"
        onClick={toggle}
        type="button"
        aria-label={playing ? "pause" : "play"}
      >
        <div className="rp-play-top">{playing ? "pause" : "play"}</div>
        <div className="rp-play-icon">{playing ? "❚❚" : "▶"}</div>
      </button>

      <div className="rp-info">
        <div className="rp-title">{title}</div>

        <div className="rp-time">
          <span>{fmt(cur)}</span>
          <span>{fmt(dur)}</span>
        </div>

        <div
          className="rp-progress"
          onClick={(e) => {
            const a = audioRef.current;
            if (!a || !dur) return;
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const p = (e.clientX - rect.left) / rect.width;
            a.currentTime = Math.max(0, Math.min(dur, p * dur));
            setCur(a.currentTime);
          }}
        >
          <div className="rp-progress-fill" style={{ width: `${dur ? (cur / dur) * 100 : 0}%` }} />
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
      src={src}
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
      onEnded={() => setPlaying(false)}
    />
  </div>
);
}
