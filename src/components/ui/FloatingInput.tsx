import { useState, useId } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import cn from "@/lib/cn";
type FloatingInputProps = {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  error?: string;
  editable?: boolean;
};
export function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  error,
  editable = true,
}: FloatingInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const canEdit = editable && !!onChange;
  const isPassword = type === "password";
  const showClear = canEdit && !isPassword && value?.length > 0;
  return (
    <div>
      <div className="relative">
        {/* Input */}
        <input
          id={id}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={canEdit ? (e) => onChange?.(e.target.value) : undefined}
          onFocus={editable ? () => setFocused(true) : undefined}
          onBlur={editable ? () => setFocused(false) : undefined}
          placeholder=" "
          readOnly={!canEdit}
          className={cn(
            "w-full bg-transparent outline-none px-0 py-1 text-gray-900",
            error ? "border-red-500 border-b" : "border-gray-300 border-b-2",
            !editable && "cursor-default text-gray-600",
          )}
        />
        {/* Label */}
        <label
          htmlFor={id}
          className={cn(
            "absolute left-0 pointer-events-none text-gray-500",
            "transition-all duration-200",
            focused || value
              ? "text-xs -top-4"
              : "text-base top-1/2 -translate-y-1/2",
          )}
        >
          {label}
        </label>

        {/* Animated purple underline */}
        <span
          className={cn(
            "absolute left-0 bottom-0 h-0.5 w-full",
            "transition-transform duration-300",
            focused ? "scale-x-100" : "scale-x-0",
            error ? "bg-red-500" : "bg-purple-500",
          )}
          style={{ transformOrigin: "center" }}
        ></span>
        {/* 小眼睛 */}
        {canEdit && isPassword && (
          <button
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        {/* x号 */}
        {showClear && (
          <button
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => onChange("")}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {/* Error message */}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
