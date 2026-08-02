"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDreamRoom,
  IDLE_STATUS,
  type DreamRoom,
  type HouseView,
  type StoryAction,
} from "./scene";

const CHAPTERS: { action: StoryAction; index: string; title: string; caption: string }[] = [
  { action: "tree", index: "01", title: "爬树与体操下杠", caption: "CLIMB · SWING · 360°" },
  { action: "door", index: "02", title: "打开海之门", caption: "OPEN & SWIM" },
  { action: "piano", index: "03", title: "坐下弹钢琴", caption: "PLAY & LISTEN" },
  { action: "desk", index: "04", title: "在书桌前学习", caption: "READ & WRITE" },
];

const HOUSE_VIEWS: { view: HouseView; label: string; caption: string }[] = [
  { view: "house", label: "整栋小屋", caption: "HOUSE" },
  { view: "ground", label: "一楼", caption: "ROOM 01" },
  { view: "upper", label: "空置二楼", caption: "ROOM 02" },
];

const VIEW_TITLES: Record<HouseView, { eyebrow: string; title: string }> = {
  house: { eyebrow: "梦境小屋 / HOUSE", title: "A little house can hold a whole world." },
  ground: { eyebrow: "梦境房间 / 01", title: "Some doors open into the sea." },
  upper: { eyebrow: "梦境房间 / 02", title: "An empty room, waiting for its dream." },
};

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<DreamRoom | null>(null);
  const [status, setStatus] = useState(IDLE_STATUS);
  const [active, setActive] = useState<"idle" | StoryAction>("idle");
  const [houseView, setHouseView] = useState<HouseView>("house");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const room = createDreamRoom(mount, {
      onStatus: setStatus,
      onActive: setActive,
      onView: setHouseView,
    });
    roomRef.current = room;
    return () => {
      roomRef.current = null;
      room.dispose();
    };
  }, []);

  return (
    <main className="dream-shell">
      <header className="dream-header">
        <a className="brand" href="#" aria-label="Dream House 首页">
          DREAM<span>/HOUSE</span>
        </a>
        <div className="chapter">HOUSE 01 · THE TREE &amp; THE SEA</div>
      </header>

      <section className="scene-card" aria-label="一栋可以切换外观、一楼与二楼的可交互三维梦境小屋">
        <div ref={mountRef} className="scene-mount" />

        <div className="room-title">
          <span>{VIEW_TITLES[houseView].eyebrow}</span>
          <strong>{VIEW_TITLES[houseView].title}</strong>
        </div>

        <div className="view-switcher" aria-label="小屋视角">
          {HOUSE_VIEWS.map((item) => (
            <button
              key={item.view}
              className={houseView === item.view ? "is-active" : ""}
              onClick={() => roomRef.current?.setView(item.view)}
            >
              <small>{item.caption}</small>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="story-actions" aria-label="互动选择">
          {CHAPTERS.map((chapter) => (
            <button
              key={chapter.action}
              className={active === chapter.action ? "is-active" : ""}
              onClick={() => roomRef.current?.act(chapter.action)}
            >
              <span>{chapter.index}</span>
              <strong>{chapter.title}</strong>
              <small>{chapter.caption}</small>
            </button>
          ))}
        </div>

        <div className="interaction-hint" aria-live="polite">
          <span className="hint-dot" />
          <span>{status}</span>
        </div>

        <button
          className="reset-button"
          onClick={() => roomRef.current?.reset()}
          aria-label="重置女孩和房间动画"
        >
          ↻ 重置故事
        </button>
      </section>

      <footer className="dream-footer">
        <span>拖拽旋转 · 滚轮缩放 · 点击互动</span>
        <span>TREE · PIANO · STUDY · SEA BEYOND THE DOOR</span>
      </footer>
    </main>
  );
}
