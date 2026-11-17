import { useState, type ChangeEvent } from "react";
import { ImagePlus, X, Upload, LoaderCircle } from "lucide-react";

import Button from "../../../components/common/button";

import { useFiles, useUploadFile } from "../hooks/use-files";
import type { FileCategory } from "../types/file.types";

import FilePreview from "./file-preview";

interface FilePickerProps {
  value: string | null;
  onChange: (fileId: string | null) => void;
  category?: FileCategory;
  label?: string;
  disabled?: boolean;
}

function FilePicker({
  value,
  onChange,
  category = "IMAGE",
  label = "Select File",
  disabled = false,
}: FilePickerProps) {
  const { data, isLoading, isError } = useFiles(100, 0);
  const uploadMutation = useUploadFile();

  const [uploadError, setUploadError] = useState("");

  const files = data?.items.filter((file) => file.category === category) ?? [];

  const selectedFile = files.find((file) => file.id === value);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadError("");

    if (category === "IMAGE" && !file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Maximum file size is 10 MB");
      event.target.value = "";
      return;
    }

    try {
      const uploadedFile = await uploadMutation.mutateAsync(file);

      onChange(uploadedFile.id);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex items-start gap-4">
        <FilePreview
          fileId={value}
          alt="Selected file"
          className="size-24 rounded-xl border border-slate-200 object-cover"
          fallback={
            <div className="flex size-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
              <ImagePlus size={28} />
            </div>
          }
        />

        <div className="min-w-0 flex-1 space-y-2">
          <select
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value || null)}
            disabled={disabled || isLoading}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">Select an existing image</option>

            {files.map((file) => (
              <option key={file.id} value={file.id}>
                {file.original_name}
              </option>
            ))}
          </select>

          {isLoading && (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <LoaderCircle size={14} className="animate-spin" />
              Loading files...
            </p>
          )}

          {isError && (
            <p className="text-xs text-red-600">Unable to load files.</p>
          )}

          {!isLoading && !isError && files.length === 0 && (
            <p className="text-xs text-slate-500">
              No images available. Upload a new image.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${
                disabled || uploadMutation.isPending
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              {uploadMutation.isPending ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              Upload Image
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                disabled={disabled || uploadMutation.isPending}
                onChange={handleUpload}
              />
            </label>

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploadMutation.isPending}
                onClick={() => onChange(null)}
              >
                <X size={15} />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {selectedFile && (
        <p className="text-xs text-slate-500">
          Selected: {selectedFile.original_name}
        </p>
      )}

      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
    </div>
  );
}

export default FilePicker;
