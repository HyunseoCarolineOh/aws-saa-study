"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "HOME", emoji: "🏠", color: "#ff2e88" },
  { href: "/mock-exam", label: "BOSS", emoji: "👑", color: "#a855ff" },
  { href: "/review", label: "REMATCH", emoji: "🔄", color: "#b4ff39" },
  { href: "/concepts", label: "CODEX", emoji: "📖", color: "#00f0ff" },
  { href: "/stats", label: "SCORE", emoji: "📊", color: "#ffee00" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(18,7,38,0.85), rgba(7,2,14,0.98))",
        borderTop: "1.5px solid rgba(255, 46, 136, 0.4)",
        boxShadow: "0 -8px 24px rgba(255, 46, 136, 0.15)",
        backdropFilter: "blur(10px)",
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
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 transition-all ${isActive ? "animate-pop-in" : "opacity-50"}`}
                style={
                  isActive
                    ? {
                        background: `${item.color}14`,
                        border: `1px solid ${item.color}77`,
                        boxShadow: `0 0 14px ${item.color}55, inset 0 0 8px ${item.color}22`,
                      }
                    : {}
                }
              >
                <span
                  className={`text-lg leading-none ${isActive ? "animate-flicker" : ""}`}
                  style={isActive ? { filter: `drop-shadow(0 0 4px ${item.color})` } : {}}
                >
                  {item.emoji}
                </span>
                <span
                  className="text-[9px] font-display tracking-widest"
                  style={{
                    color: isActive ? item.color : "var(--muted)",
                    textShadow: isActive ? `0 0 6px ${item.color}99` : "none",
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
