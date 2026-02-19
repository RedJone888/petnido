"use client";
import { useRef, useEffect } from "react";
export default function VerificationCodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputs = Array.from({ length: 6 });
  const refs = useRef<HTMLInputElement[]>([]);
  useEffect(() => {
    if (value.length < 6) {
      refs.current[value.length]?.focus();
    }
  }, [value]);
  const handleChange = (index: number, v: string) => {
    if (/^\d?$/.test(v)) {
      const newValue =
        value.substring(0, index) + v + value.substring(index + 1);
      onChange(newValue.replace(/\s/g, ""));
    }
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };
  return (
    <div className="flex gap-2 justify-center mt-4 mb-6">
      {inputs.map((_, i) => (
        <input
          key={i}
          maxLength={1}
          ref={(el) => (refs.current[i] = el!)}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl border rounded-xl outline-none focus:ring-2 focus:ring-purple-400 transition"
        />
      ))}
    </div>
  );
}
