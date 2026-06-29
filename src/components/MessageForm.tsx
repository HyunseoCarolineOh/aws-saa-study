"use client";

import { useState } from "react";
import { sendMessage } from "@/lib/message";

export default function MessageForm() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 공백만 있는 경우 차단
    const trimmed = content.replace(/[\s\u200B\u200C\u200D\uFEFF]/g, "");
    if (trimmed.length === 0) {
      setStatus("error");
      setErrorMsg("메시지를 입력해주세요");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    const result = await sendMessage(content);

    if (result.success) {
      setStatus("success");
      setContent("");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
      setErrorMsg(result.error || "전송에 실패했습니다");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        maxLength={500}
        rows={3}
        placeholder="건의사항, 응원 메시지 등을 자유롭게 남겨주세요"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{content.length}/500</span>
        <button
          type="submit"
          disabled={status === "sending"}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-opacity"
        >
          {status === "sending" ? "전송 중..." : "전송"}
        </button>
      </div>
      {status === "success" && (
        <p className="text-sm text-green-400">메시지가 전송되었습니다 ✓</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
