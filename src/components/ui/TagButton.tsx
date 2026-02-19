import cn from "@/lib/cn";

interface Tag {
  id: string;
  label: string;
  color: string; // 选中的颜色类名，例如 'bg-green-500 text-white'
}

interface TagButtonProps {
  tag: Tag;
  active: boolean;
  onClick: () => void;
  required?: boolean;
  disabled?: boolean;
}

export const TagButton = ({
  tag,
  active,
  onClick,
  required,
  disabled = false,
}: TagButtonProps) => {
  return (
    <button
      type="button" // 显式声明为 button，防止触发表单提交
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-2 py-0.5 rounded-xl text-[10px] font-medium transition-all duration-200 border",
        // 未选中态
        "bg-gray-50/50 border-gray-200 text-gray-500 hover:shadow-md",
        // 选中态
        active && `border-transparent shadow-sm ${tag.color}`,
        disabled && "opacity-50 cursor-not-allowed grayscale",
        // 必填项的特殊标识（如果是寄养模式下的健康标签）
        required && !active && "border-red-100 bg-red-50/30",
      )}
    >
      <div className="flex items-center gap-1.5">
        {/* {active && (
          <svg
            className="w-2 h-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )} */}
        {tag.label}
        {disabled && active && " (包含済)"}
        {required && !active && <span className="text-red-400">*</span>}
      </div>
    </button>
  );
};
