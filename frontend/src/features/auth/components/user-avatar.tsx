import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { getAvatarUrl } from "../utils/avatar-cache";

interface UserAvatarProps {
  fileId: string | null | undefined;
  name: string;
  className?: string;
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

function UserAvatar({ fileId, name, className = "size-10" }: UserAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    setImageUrl(null);

    if (!fileId) {
      return () => {
        isActive = false;
      };
    }

    getAvatarUrl(fileId)
      .then((url) => {
        if (isActive) {
          setImageUrl(url);
        }
      })
      .catch(() => {
        if (isActive) {
          setImageUrl(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [fileId]);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name}'s avatar`}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600`}
      aria-label={`${name}'s avatar`}
    >
      {name.trim() ? getInitials(name) : <UserRound size={20} />}
    </div>
  );
}

export default UserAvatar;
