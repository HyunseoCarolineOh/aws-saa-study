"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "홈", emoji: "🏠", color: "#9bbc0f" },
  { href: "/mock-exam", label: "모의고사", emoji: "👑", color: "#e8b923" },
  { href: "/review", label: "오답", emoji: "🔄", color: "#5b9cd8" },
  { href: "/concepts", label: "도감", emoji: "📖", color: "#c4a4e0" },
  { href: "/stats", label: "스탯", emoji: "📊", color: "#d4e27a" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "var(--card)",
        borderTop: "3px solid var(--border)",
        boxShadow: "0 -2px 0 var(--background)",
      }}
    >
      <div className="max-w-lg mx-auto flex justify-around items-stretch h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 transition-opacity"
              style={{ opacity: isActive ? 1 : 0.55 }}
            >
              <div
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5"
                style={
                  isActive
                    ? {
                        background: "var(--gb-dark)",
                        border: `2px solid ${item.color}`,
                      }
                    : {}
                }
              >
                <span
                  className={`text-lg leading-none ${isActive ? "animate-pixel-bounce" : ""}`}
                  aria-hidden
                >
                  {item.emoji}
                </span>
                <span
                  className="text-[11px] font-semibold tracking-tight"
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
