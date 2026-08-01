"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDreamRoom,
  IDLE_STATUS,
  type DreamRoom,
  type StoryAction,
} from "./scene";

const CHAPTERS: { action: StoryAction; index: string; title: string; caption: string }[] = [
  { action: "tree", index: "01", title: "爬树与体操下杠", caption: "CLIMB · SWING · 360°" },
  { action: "door", index: "02", title: "打开海之门", caption: "OPEN & SWIM" },
  { action: "piano", index: "03", title: "坐下弹钢琴", caption: "PLAY & LISTEN" },
  { action: "desk", index: "04", title: "在书桌前学习", caption: "READ & WRITE" },
];

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<DreamRoom | null>(null);
  const [status, setStatus] = useState(IDLE_STATUS);
  const [active, setActive] = useState<"idle" | StoryAction>("idle");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const room = createDreamRoom(mount, { onStatus: setStatus, onActive: setActive });
    roomRef.current = room;
    return () => {
      roomRef.current = null;
      room.dispose();
    };
  }, []);

  return (
    <main className="dream-shell">
      <header className="dream-header">
        <a className="brand" href="#" aria-label="Dream Room 首页">
          DREAM<span>/ROOM</span>
        </a>
        <div className="chapter">CHAPTER 01 · THE TREE &amp; THE SEA</div>
      </header>

      <section className="scene-card" aria-label="一间有树、女孩、钢琴、书桌和海之门的可交互三维房间">
        <div ref={mountRef} className="scene-mount" />

        <div className="room-title">
          <span>梦境房间 / 01</span>
          <strong>Some doors open into the sea.</strong>
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
