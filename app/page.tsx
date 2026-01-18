"use client";

import { useEffect, useState } from "react";
import RoomScene from "../components/RoomScene";

function isProbablyMobile() {
  if (typeof window === "undefined") return false;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // если узко или портрет — считаем телефоном
  const small = w < 900 || h > w;

  // тач + юзер-агент (чтобы не сработало на маленьком окне на ПК слишком часто)
  const touch = "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
  const ua = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(
    navigator.userAgent || ""
  );

  return small && (touch || ua);
}

export default function Page() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => setMobile(isProbablyMobile());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (mobile) {
    return (
      <main className="min-h-screen w-full bg-black pixel text-white flex items-center justify-center p-6">
        <div className="max-w-[520px] text-center space-y-4">
          <div className="text-2xl">Саб, это лучше смотреть с ноутбука 💻</div>
          <div className="opacity-80">
            Тут интерактивная комната и на телефоне всё будет криво.
          </div>

          <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4 text-left">
            <div className="text-lg mb-2">Как открыть:</div>
            <ul className="list-disc pl-5 space-y-1 opacity-90">
              <li>Открой ссылку на ноутбуке / компьютере</li>
              <li>И включи звук 🙂</li>
            </ul>
          </div>

          <div className="text-sm opacity-60 mt-6">
            (если ты сейчас на телефоне — просто сохрани ссылку и открой позже)
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-screen h-screen bg-black pixel">
      <RoomScene />
    </main>
  );
}
