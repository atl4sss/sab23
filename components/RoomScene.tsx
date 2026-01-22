"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PixelModal from "./PixelModal";
import RecordPlayer from "./RecordPlayer";

type Hotspot = {
  id: string;
  title: string;
  x: number; // left %
  y: number; // top %
  w: number; // width %
  h: number; // height %
  content: string;
  z?: number;
  videoUrl?: string; // <-- add
  album?: { src: string; caption: string }[];
  letter?: string;
  audioUrl?: string;
  trackTitle?: string;
  tracks?: { title: string; src: string }[];

};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function Typewriter({
  text,
  base = 80, // больше = медленнее
  scrollRef, // ✅ контейнер со скроллом (опционально)
}: {
  text: string;
  base?: number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [i, setI] = useState(0);
  const timerRef = useRef<number | null>(null);

  // ✅ авто-скролл только если юзер "внизу"
  const autoScrollRef = useRef(true);

  // ✅ отслеживаем ручной скролл
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
      autoScrollRef.current = nearBottom;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [scrollRef]);

  useEffect(() => {
    // стопаем прошлый таймер на 100%
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setI(0);
    let cancelled = false;

    const step = (nextI: number) => {
      if (cancelled) return;
      if (nextI > text.length) return;

      setI(nextI);

      if (nextI === text.length) return;

      const ch = text[nextI - 1] || "";
      let extra = Math.floor(Math.random() * 45);

      if (ch === "." || ch === "!" || ch === "?") extra += 200;
      if (ch === "," || ch === ";" || ch === ":") extra += 150;
      if (ch === "\n") extra += 200;

      timerRef.current = window.setTimeout(() => step(nextI + 1), base + extra);
    };

    // стартовая пауза, чтобы выглядело живее
    timerRef.current = window.setTimeout(() => step(1), base + 300);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [text, base]);

  // ✅ автоскроллим вниз по мере печати, но не мешаем если юзер пролистал вверх
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    if (!autoScrollRef.current) return;

    el.scrollTop = el.scrollHeight;
  }, [i, scrollRef]);

  const shown = text.slice(0, i);
  const done = i >= text.length;

  return (
    <div className="handwriting whitespace-pre-wrap">
      {shown}
      {!done && <span className="type-caret">|</span>}
    </div>
  );
}
function ConfettiBurst({ trigger }: { trigger: number }) {
  const pieces = useMemo(() => {
    const colors = ["#F2D7B6", "#E9B7A5", "#D9C7A6", "#BFA07A", "#F1E3CF", "#E7A9C2"];

    return Array.from({ length: 70 }).map((_, i) => {
      // 3 источника: левый угол / центр / правый угол
      const r = Math.random();
      let baseLeft = 50;

      if (r < 0.33) baseLeft = 8;
      else if (r < 0.66) baseLeft = 50;
      else baseLeft = 92;

      return {
        id: `${trigger}-${i}`,
        left: baseLeft + (Math.random() * 6 - 3), // разброс вокруг источника
        delay: Math.random() * 0.9,
        dur: 2.4 + Math.random() * 1.2,
        sizeW: 6 + Math.random() * 6,
        sizeH: 10 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        drift: Math.random() * 320 - 160, // <-- НЕ по прямой: -160..+160px
      };
    });
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[3000]">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            ["--drift" as any]: `${p.drift}px`,
            position: "absolute",
            left: `${p.left}%`,
            top: "0%",
            width: `${p.sizeW}px`,
            height: `${p.sizeH}px`,
            background: p.color,
            opacity: 0,
            transform: `rotate(${p.rot}deg)`,
            animation: `confettiFall ${p.dur}s ease-out ${p.delay}s forwards`,
            borderRadius: "2px",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.10) inset",
          }}
        />
      ))}
    </div>
  );
}
function useBlowToExtinguish(onBlow: () => void, onProgress?: (p: number) => void) {
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const cooldownRef = useRef(0);
  const scoreRef = useRef(0);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }

    scoreRef.current = 0;
    cooldownRef.current = 0;
    onProgress?.(0);
  };

  const start = async () => {
    stop();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.7;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 120;

    src.connect(hp);
    hp.connect(analyser);

    ctxRef.current = ctx;
    streamRef.current = stream;

    const data = new Uint8Array(analyser.fftSize);

    const THRESH = 0.085;     // ниже = легче (0.07..0.085)
    const TARGET = 10;        // меньше = легче (8..12)
    const DECAY = 0.11;       // больше = быстрее падает прогресс
    const GAIN = 11;          // больше = быстрее растёт прогресс

    const tick = () => {
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      const now = performance.now();

      if (cooldownRef.current > now) {
        // во время кулдауна прогресс не растим
      } else {
        const over = Math.max(0, rms - THRESH);

        if (over > 0) {
          // плавный рост
          scoreRef.current += over * GAIN;
        } else {
          // плавный спад
          scoreRef.current = Math.max(0, scoreRef.current - DECAY);
        }

        const p = Math.max(0, Math.min(1, scoreRef.current / TARGET));
        onProgress?.(p);

        if (scoreRef.current >= TARGET) {
          cooldownRef.current = now + 2000;
          scoreRef.current = 0;
          onProgress?.(1);
          onBlow();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);
  return { start, stop };
}

export default function RoomScene() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });
  const [imgSize, setImgSize] = useState({ w: 1920, h: 1080 });

  const [debug, setDebug] = useState(false);
  const [edit, setEdit] = useState(false);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [finalOpen, setFinalOpen] = useState(false);
  const [finalShown, setFinalShown] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const letterScrollRef = useRef<HTMLDivElement | null>(null);


  const [modalId, setModalId] = useState<string | null>(null);

  const [blowProgress, setBlowProgress] = useState(0); // 0..1
  const [cakeBlown, setCakeBlown] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const blow = useBlowToExtinguish(
    () => {
      setCakeBlown(true);
      setMicOn(false);
      blow.stop();
    },
    (p) => setBlowProgress(p)
  );


  const [showVideo, setShowVideo] = useState(false);
  const [albumIndex, setAlbumIndex] = useState(0);
  const [flipDir, setFlipDir] = useState<"next" | "prev" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);

  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fmt = (s: number) => {
    if (!isFinite(s) || s <= 0) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!modalId) {
      setCakeBlown(false);
      setMicOn(false);
      setMicError(null);
      setBlowProgress(0);
      blow.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalId]);



  useEffect(() => {
    setAlbumIndex(0);
    setFlipDir(null);
    setShowVideo(false);
  }, [modalId]);


  // для редактора
  const [selectedId, setSelectedId] = useState<string>("cake");
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);

  const hotspots: Hotspot[] = useMemo(
    () => [
      {
        id: "cake",
        title: "Cake 🎂",
        x: 60.4,
        y: 73.9,
        w: 13.6,
        h: 24.7,
        z: 30,
        content: "I already owed you two wishes… and now you have to think of a third😭",
      },
      {
        id: "presents",
        title: "Gifts 🎁",
        x: 2.2,
        y: 60,
        w: 19.2,
        h: 34.4,
        content: "Open them: there’s a secret inside!",
        videoUrl: "/videos/ronaldo.mp4",
      },
      {
        id: "boombox",
        title: "Music 📻",
        x: 74,
        y: 80,
        w: 16,
        h: 12,
        content: "click play :)",
        tracks: [
          { title: "✨Frank Sinatra — The Way You Look Tonight", src: "/audio/sab.mp3" },
          { title: "🌙 M’Dee — Потеряться", src: "/audio/track2.mp3" },
          { title: "🫶🏽 Mac Miller — Surf", src: "/audio/track3.mp3" },
        ],
      },
      {
        id: "poster_kniga",
        title: "Poster 📚",
        x: 71,
        y: 18,
        w: 16,
        h: 22,
        content: "Tvoya knizhka po psikhologii kotoruyu ty tak lyubish'😜",
      },
      {
        id: "vaseflowers",
        title: "Flowers 💐",
        x: 72.1,
        y: 47.4,
        w: 17.2,
        h: 30,
        content: "A tiny bouquet, just to say: I’m here. Even if I’m not “here” here😔",
      },
      {
        id: "window",
        title: "Window 🚗",
        x: 32.9,
        y: 1.3,
        w: 35.4,
        h: 51.4,
        content: "Tvoi Renzhik na 23 den' rozhdeniya😛😛😛(bez vozduha)",
      },
      {
        id: "poster_drink",
        title: "Poster: Matcha 🥤",
        x: 0.9,
        y: 16.5,
        w: 13.4,
        h: 22.6,
        content: "Every day I hope life feels a little softer for you.\nAnd that your matcha always hits perfect🫶🏼",
        z: 20,
      },
      {
        id: "poster_plane",
        title: "Poster: Private Jet ✈️",
        x: 13,
        y: 34.2,
        w: 12.6,
        h: 22.4,
        content: "Moe pervoye obeshanie kotoroe ya dal tebe! Cherez let 5 ya kuplyu nam s toboy chastnyy jet. I my polyetim kuda ugodno, kogda ugodno. Ya obeshayu. (chut' chut' s vozduhom)",
        z: 20,
      },
      {
        id: "album",
        title: "Album 📖",
        x: 45.5,
        y: 74.5,
        w: 9.5,
        h: 9.0,
        content: "The best and most favorite photos I’ve ever seen of you🥹🥹 ",
         album: [
          { src: "/album/1.jpeg", caption: "caption 1" },
          { src: "/album/2.jpeg", caption: "caption 2" },
          { src: "/album/3.jpeg", caption: "caption 3" },
          { src: "/album/4.jpeg", caption: "caption 3" },
          { src: "/album/5.jpeg", caption: "caption 3" },
          { src: "/album/6.jpeg", caption: "caption 3" },
          { src: "/album/7.jpeg", caption: "caption 3" },
          { src: "/album/8.jpeg", caption: "caption 3" },
         ]
      },
      {
        id: "shkaf",
        title: "Shelf 📚",
        x: 90.4,
        y: 33.7,
        w: 8.7,
        h: 46.3,
        content: "A little letter for you.",
        letter: `Sab,

      Happy birthday.

      I just want you to know how much I appreciate you. Even in quiet moments and unspoken days, you mattered more than you realize.

      I still can’t believe the girl I used to ask Meruert Apay about during breaks is now the one I’m writing a birthday message to a year later. It’s honestly wild — in a good way.

      This year was heavy, and somehow, knowing you were there made it a little easier to carry things. Thank you for the kindness, the patience, and the presence you gave — whether you knew it or not.

      And honestly, I still remember this one small moment: the next day, on the third floor, you were the first to say hi to me while I was sitting on the couch near the classroom. It’s such a tiny thing, and maybe it shouldn’t mean much — but it stuck with me. Moments like that stay in my head, and they just make me appreciate you even more.

      Today, I hope you feel loved in the simple ways: good music, warm messages, small comforts, and a few moments where you forget everything else and just smile. I hope this new year of your life brings you peace, healing, and softer days. You deserve good things, even after everything.

      Happy 20th, Sab 🤍`,
      },

    ],
    []
  );
  const requiredIds = useMemo(
  () =>
    hotspots
      .map((h) => h.id)
      // если хочешь исключить что-то:
      // .filter((id) => id !== "window")
      ,
  [hotspots]
);

const seenCount = useMemo(
  () => requiredIds.filter((id) => seen[id]).length,
  [requiredIds, seen]
);
const totalCount = requiredIds.length;
const allSeen = totalCount > 0 && seenCount === totalCount;



  const active = hotspots.find((h) => h.id === modalId) || null;

  // размер контейнера
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setWrapSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // хоткеи
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();

      if (k === "g") setDebug((v) => !v);
      if (k === "e") setEdit((v) => !v);

      if (k === "escape") {
        setDragging(false);
        setDragStart(null);
        setDragEnd(null);
      }

      if (k === "[" || k === "{") {
        // prev
        const idx = hotspots.findIndex((h) => h.id === selectedId);
        const next = idx <= 0 ? hotspots[hotspots.length - 1] : hotspots[idx - 1];
        setSelectedId(next.id);
      }
      if (k === "]" || k === "}") {
        // next
        const idx = hotspots.findIndex((h) => h.id === selectedId);
        const next = idx === -1 || idx >= hotspots.length - 1 ? hotspots[0] : hotspots[idx + 1];
        setSelectedId(next.id);
      }

      if (k === "r" && edit) {
        const cur = selectedId;
        const newId = prompt("new id for hotspot:", cur);
        if (newId && newId.trim()) setSelectedId(newId.trim());
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotspots, selectedId, edit]);

  // cover-математика
  const fitted = useMemo(() => {
    const cw = wrapSize.w;
    const ch = wrapSize.h;
    const iw = imgSize.w;
    const ih = imgSize.h;

    if (!cw || !ch || !iw || !ih) return { x: 0, y: 0, w: 0, h: 0, scale: 1 };

    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    return { x, y, w, h, scale };
  }, [wrapSize.w, wrapSize.h, imgSize.w, imgSize.h]);

  // помощник: из клиентских координат -> проценты по fitted
  const clientToPct = (clientX: number, clientY: number) => {
    const px = (clientX - fitted.x) / fitted.w;
    const py = (clientY - fitted.y) / fitted.h;
    return {
      x: clamp(px, 0, 1) * 100,
      y: clamp(py, 0, 1) * 100,
    };
  };

  // отрисовка текущей рамки в px
  const dragRectPx = useMemo(() => {
    if (!dragStart || !dragEnd) return null;

    const x1 = Math.min(dragStart.x, dragEnd.x);
    const y1 = Math.min(dragStart.y, dragEnd.y);
    const x2 = Math.max(dragStart.x, dragEnd.x);
    const y2 = Math.max(dragStart.y, dragEnd.y);

    return { left: x1, top: y1, width: x2 - x1, height: y2 - y1 };
  }, [dragStart, dragEnd]);
  const closeModal = () => {
      // stop boombox when closing any modal
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
  setIsPlaying(false);
  setModalId(null);

  // ✅ финал после закрытия последней модалки (и только один раз)
  if (!finalShown && allSeen) {
    setFinalShown(true);
    setConfettiKey((k) => k + 1); // триггер конфетти
    setTimeout(() => setFinalOpen(true), 450);
  }
};
  return (
    <div
      ref={wrapRef}
      className="relative w-screen h-screen overflow-hidden pixel select-none"
      onMouseDown={(e) => {
        if (!edit) return;
        if (e.button !== 0) return; // только ЛКМ

        setDragging(true);
        setModalId(null);

        setDragStart({ x: e.clientX, y: e.clientY });
        setDragEnd({ x: e.clientX, y: e.clientY });
      }}
      onMouseMove={(e) => {
        if (!edit || !dragging) return;
        setDragEnd({ x: e.clientX, y: e.clientY });
      }}
      onMouseUp={(e) => {
        if (!edit || !dragging) return;

        setDragging(false);

        if (!dragStart || !dragEnd) return;

        // считаем проценты (по fitted-картинке!)
        const a = clientToPct(dragStart.x, dragStart.y);
        const b = clientToPct(dragEnd.x, dragEnd.y);

        const left = round1(Math.min(a.x, b.x));
        const top = round1(Math.min(a.y, b.y));
        const w = round1(Math.abs(a.x - b.x));
        const h = round1(Math.abs(a.y - b.y));

        const json = `{ id: "${selectedId}", x: ${left}, y: ${top}, w: ${w}, h: ${h} },`;
        navigator.clipboard?.writeText(json).catch(() => {});
        console.log("copied:", json);
      }}
    >
      {/* фон */}
      <img
        src="/scene/room.png"
        alt="room"
        draggable={false}
        className="absolute"
        style={{
          left: fitted.x,
          top: fitted.y,
          width: fitted.w,
          height: fitted.h,
          pointerEvents: "none",
        }}
        onLoad={(e) => {
          const img = e.currentTarget;
          setImgSize({
            w: img.naturalWidth || 1920,
            h: img.naturalHeight || 1080,
          });
        }}
      />

      {/* рамка редактора */}
      {edit && dragRectPx && (
        <div
          className="absolute z-[120] pointer-events-none"
          style={{
            left: dragRectPx.left,
            top: dragRectPx.top,
            width: dragRectPx.width,
            height: dragRectPx.height,
            border: "2px solid rgba(0,255,255,0.9)",
            background: "rgba(0,255,255,0.12)",
          }}
        />
      )}

      {/* хитбоксы */}
      {hotspots.map((h) => {
        const left = fitted.x + (fitted.w * h.x) / 100;
        const top = fitted.y + (fitted.h * h.y) / 100;
        const w = (fitted.w * h.w) / 100;
        const hh = (fitted.h * h.h) / 100;

        const selected = h.id === selectedId;


        return (
          <button
            key={h.id}
            className="absolute"
            style={{
              zIndex: h.z ?? 50,
              left,
              top,
              width: w,
              height: hh,
              background: debug ? (selected ? "rgba(0,255,255,0.18)" : "rgba(255,0,0,0.18)") : "transparent",
              border: debug ? (selected ? "2px solid rgba(0,255,255,0.9)" : "1px solid rgba(255,255,255,0.6)") : "none",
            }}
        onClick={() => {
          if (edit) {
            setSelectedId(h.id);
            return;
          }

          setSeen((prev) => ({ ...prev, [h.id]: true }));
          setModalId(h.id);
        }}
            aria-label={h.title}
            title={debug ? `${h.id} (${h.x} ${h.y} ${h.w} ${h.h})` : h.title}
          />
        );
      })}

      {/* HUD */}
      <div className="absolute left-4 bottom-4 z-[80] flex items-center gap-3">
        <div className="bg-black/55 text-white px-4 py-2 border border-white/15 text-base font-semibold">
          Sabina • 20 🎉
        </div>
      </div>

      <div className="absolute right-4 bottom-4 z-[80] flex items-center gap-3">
        <div className="bg-black/55 text-white px-4 py-2 border border-white/15 text-base font-semibold">
          click objects
        </div>
      </div>

      {/* подсказки */}
      {/* top-left: progress only */}
      <div className="absolute left-4 top-4 z-[90]">
        <div className="bg-black/40 text-white px-3 py-2 border border-white/10 text-xs">
          {seenCount}/{totalCount} found
        </div>

        {/* optional: маленький индикатор что включено, без подсказок клавиш */}
        {(debug || edit) && (
          <div className="mt-2 bg-black/35 text-white/80 px-3 py-2 border border-white/10 text-[11px]">
            {debug && <div>debug on</div>}
            {edit && <div>edit on</div>}
          </div>
        )}
      </div>

    <PixelModal open={!!active} title={active?.title || ""} onClose={closeModal}>
      {active?.id === "presents" && active?.videoUrl ? (
        <div className="space-y-3">
          <div>{active.content}</div>

          {!showVideo ? (
            <button
              className="px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-base font-semibold"
              onClick={() => setShowVideo(true)}
            >
              open the surprise ▶
            </button>
          ) : (
            <div className="w-full flex justify-center">
              <div
                className="border border-white/15 overflow-hidden"
                style={{ width: "min(360px, 100%)", aspectRatio: "480 / 880" }}
              >
                <video
                  src={active.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
      ) : active?.id === "cake" ? (
        <div className="space-y-4">
          <div className="text-sm opacity-80">{active.content}</div>

          {/* cake stage (чтобы не залезало на текст и было ровно по центру) */}
          <div className="cake-stage">
          <div
            className={`cake ${cakeBlown ? "is-blown" : ""}`}
            style={{ ["--blow" as any]: blowProgress }}
          >
          {micOn && !cakeBlown && (
            <div className="blowbar">
              <div className="blowbar-top">
                <span>blow</span>
                <span>{Math.round(blowProgress * 100)}%</span>
              </div>
              <div className="blowbar-track" aria-label="blow progress">
                <div className="blowbar-fill" style={{ width: `${blowProgress * 100}%` }} />
              </div>
            </div>
          )}
              <div className="candles candles-20">
                <div className="candleNum num2">
                  2
                  <div className="wick" />
                  <div className="flame" />
                  <div className="smoke" />
                </div>

                <div className="candleNum num0">
                  0
                  <div className="wick" />
                  <div className="flame" />
                  <div className="smoke" />
                </div>
              </div>

              <div className="cake-top" />
              <div className="cake-mid" />
              <div className="cake-bot" />
              <div className="cake-shadow" />
            </div>
          </div>

          {!cakeBlown ? (
            <div className="space-y-2">
              {!micOn ? (
                <button
                  className="w-full px-3 py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-base font-semibold"
                  onClick={async () => {
                    setMicError(null);
                    try {
                      await blow.start();
                      setMicOn(true);
                    } catch {
                      setMicError("mic permission blocked (or not supported)");
                      setMicOn(false);
                    }
                  }}
                >
                  enable mic and blow 🎤💨
                </button>
              ) : (
                <button
                  className="w-full px-3 py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-base font-semibold"
                  onClick={() => {
                    blow.stop();
                    setMicOn(false);
                  }}
                >
                  listening… blow now 💨 (tap to stop)
                </button>
              )}

              {micError && (
                <div className="text-xs opacity-70 border border-white/15 bg-white/5 p-2">
                  {micError}
                </div>
              )}

              <div className="text-xs text-white/60">
                tip: blow close to the mic for ~1 second
              </div>
            </div>
          ) : (
            <div className="border border-white/15 bg-white/5 p-3 text-sm">
              Теперь свои 3 желания загадаешь мне когда захочешь чтобы я их исполнил. Жду что нибудь инетерсное 😜
            </div>
          )}
        </div>
      ) : active?.id === "boombox" && active?.tracks?.length ? (
        <div className="space-y-3">
          <div className="text-sm opacity-80">{active.content}</div>
          <RecordPlayer tracks={active.tracks} initialVolume={0.25} />
        </div>
      ) : active?.id === "album" && active?.album?.length ? (
        <div className="space-y-3 pb-2">
          <div>{active.content}</div>

          <div className="flip-wrap w-full flex justify-center">
            <div className="w-full max-w-[360px]">
              <div
                className={`flip-page border border-white/15 overflow-hidden bg-black/20 ${
                  flipDir ? (flipDir === "next" ? "flip-next" : "flip-prev") : ""
                }`}
                onAnimationEnd={() => setFlipDir(null)}
              >
                <img
                  src={active.album[albumIndex].src}
                  alt={`album ${albumIndex + 1}`}
                  className="w-full h-auto block"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              className="px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-base font-semibold"
              onClick={() => {
                setFlipDir("prev");
                setTimeout(() => {
                  setAlbumIndex((i) => (i - 1 + active.album!.length) % active.album!.length);
                }, 180);
              }}
            >
              ←
            </button>

            <div className="text-xs opacity-70">
              {albumIndex + 1}/{active.album.length}
            </div>

            <button
              className="px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-base font-semibold"
              onClick={() => {
                setFlipDir("next");
                setTimeout(() => {
                  setAlbumIndex((i) => (i + 1) % active.album!.length);
                }, 180);
              }}
            >
              →
            </button>
          </div>
        </div>
      ) : active?.id === "shkaf" && active?.letter ? (
        <div className="space-y-3">
          <div className="text-sm opacity-80">{active.content}</div>
          <div
            ref={letterScrollRef}
            className="border border-white/15 bg-white/5 p-4 max-h-[55vh] overflow-y-auto pr-3"
          >
            <Typewriter key={active.id} text={active.letter} base={35} scrollRef={letterScrollRef} />
          </div>
        </div>
      ) : (
        <div>{active?.content || ""}</div>
      )}
    </PixelModal>
      {finalOpen && <ConfettiBurst trigger={confettiKey} />}

    <PixelModal open={finalOpen} title={"one last thing ✨"} onClose={() => setFinalOpen(false)} animate={true}>
      <div className="space-y-3">
        <div className="text-white/90">
          you clicked everything, so you here is the final message.
        </div>

        <div className="border border-white/15 bg-white/5 p-4 leading-relaxed">
          Sab, I’m really happy you exist. If life gets loud or heavy, just remember this:
          <br />
          I’m always on your side, and I’m not going anywhere.
          <br />
          Happy birthday 🤍
        </div>

        <div className="text-xs text-white/60">
          ({seenCount}/{totalCount} objects found)
        </div>
      </div>
    </PixelModal>


    </div>
  );
}
