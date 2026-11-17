import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { downloadFile } from "../services/file.service";

interface FilePreviewProps {
  fileId: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
}

function FilePreview({
  fileId,
  alt = "File preview",
  className = "",
  fallback,
}: FilePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;
    let objectUrl: string | null = null;

    setImageUrl(null);
    setHasError(false);

    if (!fileId) {
      setIsLoading(false);
      return;
    }

    async function loadImage() {
      setIsLoading(true);

      try {
        const blob = await downloadFile(fileId!);

        if (!blob.type.startsWith("image/")) {
          throw new Error("File is not an image");
        }

        objectUrl = URL.createObjectURL(blob);

        if (isActive) {
          setImageUrl(objectUrl);
        }
      } catch {
        if (isActive) {
          setHasError(true);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadImage();

    return () => {
      isActive = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  if (!fileId || hasError) {
    return <>{fallback ?? null}</>;
  }

  if (isLoading || !imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 ${className}`}
      >
        <LoaderCircle size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return <img src={imageUrl} alt={alt} className={className} />;
}

export default FilePreview;
