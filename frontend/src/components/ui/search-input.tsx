import { Search, X } from "lucide-react";
import type { InputHTMLAttributes } from "react";

interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  onClear?: () => void;
}

function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  disabled = false,
  ...props
}: SearchInputProps) {
  const hasValue = String(value ?? "").length > 0;

  return (
    <div className={`relative w-full ${className}`}>
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="
          h-10 w-full rounded-lg border border-slate-200 bg-white
          pl-10 pr-10 text-sm font-normal leading-5 text-slate-900
          placeholder:text-slate-400 outline-none transition
          focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          disabled:cursor-not-allowed disabled:bg-slate-100
        "
        {...props}
      />

      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          aria-label="Clear search"
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-slate-400 transition hover:text-slate-700
            disabled:cursor-not-allowed
          "
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
