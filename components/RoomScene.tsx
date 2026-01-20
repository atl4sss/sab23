"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PixelModal from "./PixelModal";

type Hotspot = {
  id: string;
  title: string;
  x: number; // left %
  y: number; // top %
  w: number; // width %
  h: number; // height %
  content: string;
  z?: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function RoomScene() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });
  const [imgSize, setImgSize] = useState({ w: 2560, h: 1600 });

  const [debug, setDebug] = useState(false);
  const [edit, setEdit] = useState(false);

  const [modalId, setModalId] = useState<string | null>(null);

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
        content: "Sab, make 3 wishes. I’ll genuinely try to make at least one come true soon 😭🤍",
      },
      {
        id: "presents",
        title: "Gifts 🎁",
        x: 2.2,
        y: 60,
        w: 19.2,
        h: 34.4,
        content: "Open them: there’s a secret inside. (we can add a video/gallery/message later)",
      },
      {
        id: "sofa",
        title: "Sofa 🛋️",
        x: 29.5,
        y: 49.9,
        w: 41.4,
        h: 34.3,
        z: 10,
        content: "This is the sofa for cozy nights. The cat says: “meow, Sab is the best” 🐱",
      },
      {
        id: "boombox",
        title: "Music 📻",
        x: 74,
        y: 80,
        w: 16,
        h: 12,
        content: "We’ll put your song here. (later: mp3 / Spotify link)",
      },
      {
        id: "poster_kniga",
        title: "Poster 📚",
        x: 71,
        y: 18,
        w: 16,
        h: 22,
        content: "Your favorite book vibe ✨",
      },
      {
        id: "vaseflowers",
        title: "Flowers 💐",
        x: 72.1,
        y: 47.4,
        w: 17.2,
        h: 30,
        content: "A tiny bouquet. Like “I’m here” even when I’m not 🌹",
      },
      {
        id: "window",
        title: "Window 🚗",
        x: 32.9,
        y: 1.3,
        w: 35.4,
        h: 51.4,
        content: "See that Range Rover? Yeah… it’s a sign 😌",
      },
      {
        id: "poster_drink",
        title: "Poster: Matcha 🥤",
        x: 0.9,
        y: 16.5,
        w: 13.4,
        h: 22.6,
        content: "A matcha poster. (we can add a tiny story / meme / message here)",
        z: 20,
      },
      {
        id: "poster_plane",
        title: "Poster: Private Jet ✈️",
        x: 13,
        y: 34.2,
        w: 12.6,
        h: 22.4,
        content: "A little plane poster. (we can add something about trips / dreams here)",
        z: 20,
      },
      {
        id: "album",
        title: "Album 📖",
        x: 45.5,
        y: 74.5,
        w: 9.5,
        h: 9.0,
        content: "We can turn this into a mini gallery: 5–10 photos + small captions. Tell me which ones 🤍",
      },
      {
        id: "shkaf",
        title: "Shelf 📚",
        x: 90.4,
        y: 33.7,
        w: 8.7,
        h: 46.3,
        content: "There’s a hidden note on the shelf. (later we can add a longer letter with scroll)",
      },
    ],
    []
  );


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
        src="/scene/room1920.png"
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
            w: img.naturalWidth || 2560,
            h: img.naturalHeight || 1600,
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
              setModalId(h.id);
            }}
            aria-label={h.title}
            title={debug ? `${h.id} (${h.x} ${h.y} ${h.w} ${h.h})` : h.title}
          />
        );
      })}

      {/* HUD */}
      <div className="absolute left-4 bottom-4 z-[80] flex items-center gap-3">
        <div className="bg-black/55 text-white px-4 py-2 border border-white/15 text-sm">
          Sabina • 20 🎉
        </div>
      </div>

      <div className="absolute right-4 bottom-4 z-[80] flex items-center gap-3">
        <div className="bg-black/55 text-white px-4 py-2 border border-white/15 text-sm">
          click objects
        </div>
      </div>

      {/* подсказки */}
      <div className="absolute left-4 top-4 z-[90] space-y-2">
        <div className="bg-black/40 text-white px-3 py-2 border border-white/10 text-xs">
          G = debug • E = edit hitboxes
        </div>
        {edit && (
          <div className="bg-black/55 text-white px-3 py-2 border border-white/10 text-xs">
            edit on • selected: <b>{selectedId}</b> • drag to copy x/y/w/h
            <br />
            [ ] switch • R rename • Esc cancel
          </div>
        )}
      </div>

      <PixelModal open={!!active} title={active?.title || ""} onClose={() => setModalId(null)}>
        {active?.content || ""}
      </PixelModal>
    </div>
  );
}
