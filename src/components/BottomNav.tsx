"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "홈", emoji: "🏠", grad: "linear-gradient(135deg, #ff6b9d, #c86fff)" },
  { href: "/mock-exam", label: "보스", emoji: "👑", grad: "linear-gradient(135deg, #c86fff, #7b61ff)" },
  { href: "/review", label: "복습", emoji: "🔄", grad: "linear-gradient(135deg, #4adede, #7b61ff)" },
  { href: "/concepts", label: "도감", emoji: "📖", grad: "linear-gradient(135deg, #ffe156, #ffa040)" },
  { href: "/stats", label: "스탯", emoji: "✨", grad: "linear-gradient(135deg, #7bff9a, #4adede)" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(26, 18, 56, 0.85), rgba(13, 8, 35, 0.98))",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="max-w-lg mx-auto flex justify-around items-end h-20 px-2 pb-3 pt-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full transition-all relative"
            >
              <div
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  isActive ? "animate-pop-in" : "opacity-55"
                }`}
                style={
                  isActive
                    ? {
                        background: item.grad,
                        padding: "8px 14px",
                        borderRadius: "999px",
                        boxShadow:
                          "0 8px 20px -4px rgba(255, 107, 157, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
                      }
                    : { padding: "8px 14px" }
                }
              >
                <span className={`text-xl leading-none ${isActive ? "animate-jelly-bounce" : ""}`}>{item.emoji}</span>
                <span
                  className="text-[10px] font-black mt-0.5"
                  style={{ color: isActive ? "#ffffff" : "var(--muted)" }}
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
