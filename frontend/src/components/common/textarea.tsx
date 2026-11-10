import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

function Textarea({
  label,
  error,
  helperText,
  id,
  className = "",
  required,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        required={required}
        rows={rows}
        className={`
          w-full resize-y rounded-lg border bg-white px-3 py-2.5
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

export default Textarea;
