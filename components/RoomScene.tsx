"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PixelModal from "./PixelModal";

type Hotspot = {
  id: string;
  title: string;
  // проценты по исходной картинке room.png (3840x2160)
  x: number; // left %
  y: number; // top %
  w: number; // width %
  h: number; // height %
  content: string;
};

export default function RoomScene() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });
  const [imgSize, setImgSize] = useState({ w: 3840, h: 2160 });

  const [debug, setDebug] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);

  const hotspots: Hotspot[] = useMemo(
    () => [
      {
        id: "cake",
        title: "Торт 🎂",
        x: 7,
        y: 77,
        w: 18,
        h: 18,
        content:
          "Саб, загадай 3 желания. Я честно постараюсь выполнить хотя бы одно быстро 😭🤍",
      },
      {
        id: "presents",
        title: "Подарки 🎁",
        x: 10,
        y: 55,
        w: 16,
        h: 25,
        content:
          "Открывай: внутри секрет. (потом сюда добавим видео/галерею/пожелание)",
      },
      {
        id: "sofa",
        title: "Диван 🛋️",
        x: 35,
        y: 60,
        w: 32,
        h: 30,
        content:
          "Это диван для уютных вечеров. котик говорит: «мяу, Саб лучшая» 🐱",
      },
      {
        id: "boombox",
        title: "Музыка 📻",
        x: 74,
        y: 80,
        w: 16,
        h: 12,
        content:
          "Тут будет кнопка включить твою песню. (потом добавим mp3/spotify ссылку)",
      },
      {
        id: "lamp",
        title: "Лампа 💡",
        x: 71,
        y: 18,
        w: 16,
        h: 22,
        content:
          "клик-клик. это лампа настроения. потом сделаем переключение света (теплее/холоднее)",
      },
      {
        id: "vaseflowers",
        title: "Цветы 💐",
        x: 69,
        y: 47,
        w: 18,
        h: 18,
        content:
          "мини букетик. типа «я рядом» даже если не рядом 🌹",
      },
      {
        id: "window",
        title: "Окно 🚗",
        x: 37,
        y: 22,
        w: 26,
        h: 28,
        content:
          "видишь там range rover? ну короче это знак 😌",
      },
      {
        id: "posters",
        title: "Постеры 🖼️",
        x: 3,
        y: 30,
        w: 20,
        h: 32,
        content:
          "тут можно сделать галерею фоток 5-10 штук (ты говорил будет по ссылке) — добавим позже",
      },
      {
        id: "shkaf",
        title: "Полка 📚",
        x: 82,
        y: 10,
        w: 13,
        h: 18,
        content:
          "на полке спрятана записка. (потом добавим длинное письмо со скроллом)",
      },
    ],
    []
  );

  const active = hotspots.find((h) => h.id === modalId) || null;

  // считаем размер контейнера
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

  // debug toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "g") setDebug((v) => !v); // G = grid/debug
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // объект-fit: cover, но делаем его вручную чтобы хитбоксы совпадали
  const fitted = useMemo(() => {
    const cw = wrapSize.w;
    const ch = wrapSize.h;
    const iw = imgSize.w;
    const ih = imgSize.h;

    if (!cw || !ch || !iw || !ih) {
      return { x: 0, y: 0, w: 0, h: 0, scale: 1 };
    }

    const scale = Math.max(cw / iw, ch / ih); // cover
    const w = iw * scale;
    const h = ih * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    return { x, y, w, h, scale };
  }, [wrapSize.w, wrapSize.h, imgSize.w, imgSize.h]);

  return (
    <div ref={wrapRef} className="relative w-screen h-screen overflow-hidden pixel">
      {/* фон-картинка сцены (cover, на весь экран) */}
      <img
        ref={imgRef}
        src="/scene/room.png"
        alt="room"
        draggable={false}
        className="absolute"
        style={{
          left: fitted.x,
          top: fitted.y,
          width: fitted.w,
          height: fitted.h,
        }}
        onLoad={(e) => {
          const img = e.currentTarget;
          // натуральные размеры (на всякий)
          setImgSize({
            w: img.naturalWidth || 3840,
            h: img.naturalHeight || 2160,
          });
        }}
      />

      {/* невидимые хитбоксы */}
      {hotspots.map((h) => {
        const left = fitted.x + (fitted.w * h.x) / 100;
        const top = fitted.y + (fitted.h * h.y) / 100;
        const w = (fitted.w * h.w) / 100;
        const hh = (fitted.h * h.h) / 100;

        return (
          <button
            key={h.id}
            className="absolute z-[50]"
            style={{
              left,
              top,
              width: w,
              height: hh,
              background: debug ? "rgba(255, 0, 0, 0.18)" : "transparent",
              border: debug ? "1px solid rgba(255,255,255,0.6)" : "none",
            }}
            onClick={() => setModalId(h.id)}
            aria-label={h.title}
            title={debug ? `${h.id} (${h.x} ${h.y} ${h.w} ${h.h})` : h.title}
          />
        );
      })}

      {/* HUD снизу как в игре */}
      <div className="absolute left-4 bottom-4 z-[80] flex items-center gap-3">
        <div className="bg-black/55 text-white px-4 py-2 border border-white/15 text-sm">
          Сабина • 20 🎉
        </div>
      </div>

      <div className="absolute right-4 bottom-4 z-[80] flex items-center gap-3">
        <div className="bg-black/55 text-white px-4 py-2 border border-white/15 text-sm">
          кликай предметы
        </div>
      </div>

      {/* подсказка debug */}
      <div className="absolute left-4 top-4 z-[80]">
        <div className="bg-black/40 text-white px-3 py-2 border border-white/10 text-xs">
          G = debug хитбоксы
        </div>
      </div>

      <PixelModal
        open={!!active}
        title={active?.title || ""}
        onClose={() => setModalId(null)}
      >
        {active?.content || ""}
      </PixelModal>
    </div>
  );
}
