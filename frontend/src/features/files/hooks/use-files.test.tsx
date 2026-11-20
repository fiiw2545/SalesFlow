import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  getFiles,
  getFile,
  uploadFile,
  downloadFile,
  deleteFile,
} from "../services/file.service";

import {
  useFiles,
  useFile,
  useUploadFile,
  useDownloadFile,
  useDeleteFile,
} from "./use-files";

import type { StoredFile, FileListResponse } from "../types/file.types";

const { mockUseOrganization } = vi.hoisted(() => ({
  mockUseOrganization: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: mockUseOrganization,
}));

vi.mock("../services/file.service", () => ({
  getFiles: vi.fn(),
  getFile: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  deleteFile: vi.fn(),
}));

const mockFile: StoredFile = {
  id: "file-123",
  organization_id: "org-123",
  owner_user_id: "user-123",
  original_name: "document.pdf",
  content_type: "application/pdf",
  extension: "pdf",
  size: 1024,
  category: "DOCUMENT",
  uploaded_by: "user-123",
  created_at: "2026-11-19T10:00:00Z",
};

const mockFileList: FileListResponse = {
  items: [mockFile],
  total: 1,
  limit: 20,
  offset: 0,
};

const mockDeleteResponse = {
  message: "File deleted successfully",
  file_id: "file-123",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

describe("useFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrganization.mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    });
  });

  it("should fetch files successfully", async () => {
    vi.mocked(getFiles).mockResolvedValue(mockFileList);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFiles(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getFiles).toHaveBeenCalledWith(20, 0);
    expect(result.current.data).toEqual(mockFileList);
  });

  it("should use custom limit and offset", async () => {
    vi.mocked(getFiles).mockResolvedValue({
      ...mockFileList,
      limit: 10,
      offset: 20,
    });

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFiles(10, 20), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getFiles).toHaveBeenCalledWith(10, 20);
  });

  it("should include organization, limit and offset in query key", async () => {
    vi.mocked(getFiles).mockResolvedValue(mockFileList);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useFiles(10, 5), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["files", "org-123", 10, 5]),
      ).toBeDefined();
    });
  });

  it("should not fetch when organization is not ready", () => {
    mockUseOrganization.mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    });

    const { wrapper } = createWrapper();

    renderHook(() => useFiles(), { wrapper });

    expect(getFiles).not.toHaveBeenCalled();
  });

  it("should not fetch without active organization", () => {
    mockUseOrganization.mockReturnValue({
      activeOrganization: null,
      isReady: true,
    });

    const { wrapper } = createWrapper();

    renderHook(() => useFiles(), { wrapper });

    expect(getFiles).not.toHaveBeenCalled();
  });
});

describe("useFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrganization.mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    });
  });

  it("should fetch a file successfully", async () => {
    vi.mocked(getFile).mockResolvedValue(mockFile);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFile("file-123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getFile).toHaveBeenCalledWith("file-123");
    expect(result.current.data).toEqual(mockFile);
  });

  it("should include organization and file ID in query key", async () => {
    vi.mocked(getFile).mockResolvedValue(mockFile);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useFile("file-123"), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["files", "org-123", "file-123"]),
      ).toBeDefined();
    });
  });

  it("should not fetch when file ID is empty", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useFile(""), { wrapper });

    expect(getFile).not.toHaveBeenCalled();
  });

  it("should not fetch without active organization", () => {
    mockUseOrganization.mockReturnValue({
      activeOrganization: null,
      isReady: true,
    });

    const { wrapper } = createWrapper();

    renderHook(() => useFile("file-123"), { wrapper });

    expect(getFile).not.toHaveBeenCalled();
  });

  it("should not fetch when organization is not ready", () => {
    mockUseOrganization.mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    });

    const { wrapper } = createWrapper();

    renderHook(() => useFile("file-123"), { wrapper });

    expect(getFile).not.toHaveBeenCalled();
  });
});

describe("useUploadFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload a file successfully", async () => {
    vi.mocked(uploadFile).mockResolvedValue(mockFile);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUploadFile(), { wrapper });
    const file = new File(["test"], "document.pdf", {
      type: "application/pdf",
    });

    await act(async () => {
      await result.current.mutateAsync(file);
    });

    expect(uploadFile).toHaveBeenCalledWith(file);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockFile);
  });

  it("should invalidate files query after successful upload", async () => {
    vi.mocked(uploadFile).mockResolvedValue(mockFile);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUploadFile(), { wrapper });
    const file = new File(["test"], "document.pdf");

    await act(async () => {
      await result.current.mutateAsync(file);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["files"],
    });
  });

  it("should handle upload error", async () => {
    vi.mocked(uploadFile).mockRejectedValue(new Error("Upload failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUploadFile(), { wrapper });
    const file = new File(["test"], "document.pdf");

    await act(async () => {
      await expect(result.current.mutateAsync(file)).rejects.toThrow(
        "Upload failed",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDownloadFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should download a file successfully", async () => {
    const blob = new Blob(["file content"], { type: "application/pdf" });
    vi.mocked(downloadFile).mockResolvedValue(blob);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDownloadFile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("file-123");
    });

    expect(downloadFile).toHaveBeenCalledWith("file-123");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(blob);
  });

  it("should handle download error", async () => {
    vi.mocked(downloadFile).mockRejectedValue(new Error("Download failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDownloadFile(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("file-123")).rejects.toThrow(
        "Download failed",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("should not invalidate files query after download", async () => {
    const blob = new Blob(["file content"]);
    vi.mocked(downloadFile).mockResolvedValue(blob);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDownloadFile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("file-123");
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useDeleteFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a file successfully", async () => {
    vi.mocked(deleteFile).mockResolvedValue(mockDeleteResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteFile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("file-123");
    });

    expect(deleteFile).toHaveBeenCalledWith("file-123");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDeleteResponse);
  });

  it("should invalidate files query after successful delete", async () => {
    vi.mocked(deleteFile).mockResolvedValue(mockDeleteResponse);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteFile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("file-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["files"],
    });
  });

  it("should handle delete error", async () => {
    vi.mocked(deleteFile).mockRejectedValue(new Error("Delete failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteFile(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("file-123")).rejects.toThrow(
        "Delete failed",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
