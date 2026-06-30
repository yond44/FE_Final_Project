import React, { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

export const Input = forwardRef(function Input({ label, hint, className = "", ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink2">{label}</span>}
      <input
        ref={ref}
        className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-[#aab2bd] focus:border-blue focus:ring-2 focus:ring-bluesoft ${className}`}
        {...props}
      />
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  );
});

// Password field with a show/hide toggle.
export function PasswordInput({ label, hint, className = "", ...props }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink2">{label}</span>}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 pr-11 text-sm text-ink outline-none transition placeholder:text-[#aab2bd] focus:border-blue focus:ring-2 focus:ring-bluesoft ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-faint transition hover:bg-line2 hover:text-ink"
          tabIndex={-1}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  );
}

export const Textarea = forwardRef(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-[#aab2bd] focus:border-blue focus:ring-2 focus:ring-bluesoft ${className}`}
      {...props}
    />
  );
});
