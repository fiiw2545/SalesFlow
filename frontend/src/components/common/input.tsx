import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  required,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input
        id={inputId}
        required={required}
        className={`
          h-10 w-full rounded-lg border bg-white px-3
          text-sm text-slate-900 placeholder:text-slate-400
          outline-none transition
          focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          disabled:cursor-not-allowed disabled:bg-slate-100
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-200"
          }
          ${className}
        `}
        {...props}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!error && helperText && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

export default Input;
