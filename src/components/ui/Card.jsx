import React from "react";

export default function Card({ children, className = "", rule = false }) {
  return (
    <div className={`relative rounded-xl border border-line bg-white shadow-card ${className}`}>
      {rule && <span className="absolute left-0 top-5 h-7 w-[3px] rounded-r bg-gold" />}
      {children}
    </div>
  );
}
