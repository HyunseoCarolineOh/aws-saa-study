"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "HOME", emoji: "🏠", color: "#9bbc0f" },
  { href: "/mock-exam", label: "BOSS", emoji: "👑", color: "#e8b923" },
  { href: "/review", label: "REDO", emoji: "🔄", color: "#8fc0e8" },
  { href: "/concepts", label: "BOOK", emoji: "📖", color: "#c4a4e0" },
  { href: "/stats", label: "STAT", emoji: "📊", color: "#d4e27a" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "#2a1f17",
        borderTop: "3px solid #5a4530",
        boxShadow: "0 -2px 0 #1a1410",
      }}
    >
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full transition-all relative"
            >
              <div
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 transition-all ${isActive ? "animate-pop-in" : "opacity-55"}`}
                style={
                  isActive
                    ? {
                        background: "#0f380f",
                        border: `2px solid ${item.color}`,
                      }
                    : {}
                }
              >
                <span className={`text-base leading-none ${isActive ? "animate-pixel-bounce" : ""}`} style={{ imageRendering: "pixelated" }}>
                  {item.emoji}
                </span>
                <span
                  className="text-[9px] font-display"
                  style={{
                    color: isActive ? item.color : "var(--muted)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
