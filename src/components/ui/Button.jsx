import React from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-ink text-white hover:bg-[#1a2741] disabled:opacity-40",
  gold: "bg-gold text-white hover:bg-[#b6841f] disabled:opacity-40",
  outline: "border border-line bg-white text-ink2 hover:border-[#cdbf9d] disabled:opacity-50",
  ghost: "text-muted hover:bg-line2 hover:text-ink disabled:opacity-50",
  danger: "text-[#b23b2e] hover:bg-[#fcefec] disabled:opacity-50",
};
const sizes = { sm: "h-8 px-3 text-xs gap-1.5", md: "h-10 px-4 text-sm gap-2", icon: "h-9 w-9" };

export default function Button({ as: Tag = "button", variant = "primary", size = "md", loading, children, className = "", ...props }) {
  return (
    <Tag
      className={`inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-2 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" /> : children}
    </Tag>
  );
}
