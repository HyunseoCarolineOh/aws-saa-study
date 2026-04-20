"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "홈", emoji: "🏠", tint: "#ffb4c6" },
  { href: "/mock-exam", label: "보스전", emoji: "👑", tint: "#c8b4ff" },
  { href: "/review", label: "수련장", emoji: "🔄", tint: "#b4f2e1" },
  { href: "/concepts", label: "도감", emoji: "📖", tint: "#ffe27a" },
  { href: "/stats", label: "스탯", emoji: "✨", tint: "#ffcba8" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(37,32,58,0.85), rgba(26,22,37,0.95))",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(200,180,255,0.2)",
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
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-full transition-all ${
                  isActive ? "animate-pop-in" : "opacity-60"
                }`}
                style={
                  isActive
                    ? {
                        background: `${item.tint}22`,
                        boxShadow: `0 0 16px ${item.tint}44`,
                      }
                    : {}
                }
              >
                <span className={`text-lg leading-none ${isActive ? "animate-bounce-soft" : ""}`}>{item.emoji}</span>
                <span
                  className="text-[10px] font-display font-bold"
                  style={{ color: isActive ? item.tint : "var(--muted)" }}
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
