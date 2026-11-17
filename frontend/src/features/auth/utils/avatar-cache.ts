import { downloadAvatar } from "../../files/services/file.service";

interface AvatarCacheEntry {
  promise: Promise<string>;
  objectUrl?: string;
}

const avatarCache = new Map<string, AvatarCacheEntry>();

export function getAvatarUrl(fileId: string): Promise<string> {
  const cached = avatarCache.get(fileId);

  if (cached) {
    return cached.promise;
  }

  const entry: AvatarCacheEntry = {
    promise: Promise.resolve(""),
  };

  entry.promise = Promise.resolve()
    .then(async () => {
      const blob = await downloadAvatar(fileId);

      if (!blob.type.startsWith("image/")) {
        throw new Error("Invalid avatar image");
      }

      const objectUrl = URL.createObjectURL(blob);

      if (avatarCache.get(fileId) === entry) {
        entry.objectUrl = objectUrl;
      } else {
        URL.revokeObjectURL(objectUrl);
      }

      return objectUrl;
    })
    .catch((error: unknown) => {
      if (avatarCache.get(fileId) === entry) {
        avatarCache.delete(fileId);
      }

      throw error;
    });

  avatarCache.set(fileId, entry);

  return entry.promise;
}

export function invalidateAvatarCache(fileId: string | null | undefined) {
  if (!fileId) return;

  const entry = avatarCache.get(fileId);

  if (entry?.objectUrl) {
    URL.revokeObjectURL(entry.objectUrl);
  }

  avatarCache.delete(fileId);
}

export function clearAvatarCache() {
  for (const entry of avatarCache.values()) {
    if (entry.objectUrl) {
      URL.revokeObjectURL(entry.objectUrl);
    }
  }

  avatarCache.clear();
}
