"use client";
import { useRef, useEffect } from "react";
export default function VerificationCodeInput({
  value,
  onChange,
  className = "my-5 justify-center",
  digitLabel = "Verification code digit",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  digitLabel?: string;
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
  const handlePaste = (event: React.ClipboardEvent) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
  };
  return (
    <div className={`flex gap-1.5 sm:gap-2 ${className}`} onPaste={handlePaste}>
      {inputs.map((_, i) => (
        <input
          key={i}
          maxLength={1}
          ref={(el) => (refs.current[i] = el!)}
          value={value[i] ?? ""}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`${digitLabel} ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-10 rounded-xl border text-center text-xl outline-none transition focus:ring-2 focus:ring-purple-400 sm:h-14 sm:w-12 sm:text-2xl"
        />
      ))}
    </div>
  );
}
