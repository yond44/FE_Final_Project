import React from "react";

export default function Empty({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-line2 text-faint">
          <Icon size={22} />
        </div>
      )}
      <p className="font-serif text-lg font-medium text-ink2">{title}</p>
      {children && <p className="mt-1 max-w-xs text-sm text-muted">{children}</p>}
    </div>
  );
}
