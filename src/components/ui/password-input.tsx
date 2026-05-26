"use client";

import { useState } from "react";

type PasswordInputProps = {
  name: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  className?: string;
};

export function PasswordInput({
  name,
  required,
  placeholder,
  autoComplete,
  minLength,
  className = "",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        required={required}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        placeholder={placeholder}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-white transition-all"
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? "🙈" : "👁"}
      </button>
    </div>
  );
}
