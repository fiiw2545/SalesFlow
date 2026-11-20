import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
} from "../services/tag.service";

import {
  useTags,
  useTag,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from "./use-tags";

import type {
  Tag,
  TagPayload,
  TagListResponse,
  TagDeleteResponse,
} from "../types/tag.types";

const {
  useOrganizationMock,
  getTagsMock,
  getTagMock,
  createTagMock,
  updateTagMock,
  deleteTagMock,
} = vi.hoisted(() => ({
  useOrganizationMock: vi.fn(),
  getTagsMock: vi.fn(),
  getTagMock: vi.fn(),
  createTagMock: vi.fn(),
  updateTagMock: vi.fn(),
  deleteTagMock: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: useOrganizationMock,
}));

vi.mock("../services/tag.service", () => ({
  getTags: getTagsMock,
  getTag: getTagMock,
  createTag: createTagMock,
  updateTag: updateTagMock,
  deleteTag: deleteTagMock,
}));

const mockTag: Tag = {
  id: "tag-123",
  name: "Important",
  color: "#FF5733",
  organization_id: "org-123",
  created_at: "2026-01-01T10:00:00Z",
};

const mockTagList: TagListResponse = {
  items: [mockTag],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockPayload: TagPayload = {
  name: "Important",
  color: "#FF5733",
};

const mockDeleteResponse: TagDeleteResponse = {
  message: "Tag deleted successfully",
};

function createWrapper(
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  }),
) {
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("Tags Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useOrganizationMock.mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    });
  });

  // useTags
  describe("useTags", () => {
    it("should fetch tags successfully", async () => {
      getTagsMock.mockResolvedValue(mockTagList);

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTags(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockTagList);
      });

      expect(getTags).toHaveBeenCalledWith(1, 10);
    });

    it("should use organization ID, page and limit in query key", async () => {
      getTagsMock.mockResolvedValue(mockTagList);

      const { queryClient, wrapper } = createWrapper();

      renderHook(() => useTags(2, 25), { wrapper });

      await waitFor(() => {
        expect(getTags).toHaveBeenCalledWith(2, 25);
      });

      expect(
        queryClient.getQueryCache().find({
          queryKey: ["tags", "org-123", 2, 25],
        }),
      ).toBeDefined();
    });

    it("should not fetch when organization is not ready", () => {
      useOrganizationMock.mockReturnValue({
        activeOrganization: { id: "org-123" },
        isReady: false,
      });

      const { wrapper } = createWrapper();

      renderHook(() => useTags(), { wrapper });

      expect(getTags).not.toHaveBeenCalled();
    });

    it("should not fetch when there is no active organization", () => {
      useOrganizationMock.mockReturnValue({
        activeOrganization: null,
        isReady: true,
      });

      const { wrapper } = createWrapper();

      renderHook(() => useTags(), { wrapper });

      expect(getTags).not.toHaveBeenCalled();
    });
  });

  // useTag
  describe("useTag", () => {
    it("should fetch a tag successfully", async () => {
      getTagMock.mockResolvedValue(mockTag);

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTag("tag-123"), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockTag);
      });

      expect(getTag).toHaveBeenCalledWith("tag-123");
    });

    it("should use organization ID and tag ID in query key", async () => {
      getTagMock.mockResolvedValue(mockTag);

      const { queryClient, wrapper } = createWrapper();

      renderHook(() => useTag("tag-123"), { wrapper });

      await waitFor(() => {
        expect(getTag).toHaveBeenCalledWith("tag-123");
      });

      expect(
        queryClient.getQueryCache().find({
          queryKey: ["tags", "org-123", "tag-123"],
        }),
      ).toBeDefined();
    });

    it("should not fetch when organization is not ready", () => {
      useOrganizationMock.mockReturnValue({
        activeOrganization: { id: "org-123" },
        isReady: false,
      });

      const { wrapper } = createWrapper();

      renderHook(() => useTag("tag-123"), { wrapper });

      expect(getTag).not.toHaveBeenCalled();
    });

    it("should not fetch when there is no active organization", () => {
      useOrganizationMock.mockReturnValue({
        activeOrganization: null,
        isReady: true,
      });

      const { wrapper } = createWrapper();

      renderHook(() => useTag("tag-123"), { wrapper });

      expect(getTag).not.toHaveBeenCalled();
    });

    it("should not fetch when tag ID is empty", () => {
      const { wrapper } = createWrapper();

      renderHook(() => useTag(""), { wrapper });

      expect(getTag).not.toHaveBeenCalled();
    });
  });

  // useCreateTag
  describe("useCreateTag", () => {
    it("should create a tag successfully", async () => {
      createTagMock.mockResolvedValue(mockTag);

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useCreateTag(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(createTag).toHaveBeenCalledWith(mockPayload);
      expect(result.current.data).toEqual(mockTag);
    });

    it("should invalidate tag queries after success", async () => {
      createTagMock.mockResolvedValue(mockTag);

      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateTag(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["tags"],
      });
    });

    it("should handle create errors", async () => {
      createTagMock.mockRejectedValue(new Error("Create failed"));

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useCreateTag(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync(mockPayload)).rejects.toThrow(
          "Create failed",
        );
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // useUpdateTag
  describe("useUpdateTag", () => {
    it("should update a tag successfully", async () => {
      updateTagMock.mockResolvedValue(mockTag);

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdateTag(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: "tag-123",
          payload: mockPayload,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(updateTag).toHaveBeenCalledWith("tag-123", mockPayload);
      expect(result.current.data).toEqual(mockTag);
    });

    it("should invalidate tag queries after success", async () => {
      updateTagMock.mockResolvedValue(mockTag);

      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateTag(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: "tag-123",
          payload: mockPayload,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["tags"],
      });
    });

    it("should handle update errors", async () => {
      updateTagMock.mockRejectedValue(new Error("Update failed"));

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdateTag(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            id: "tag-123",
            payload: mockPayload,
          }),
        ).rejects.toThrow("Update failed");
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // useDeleteTag
  describe("useDeleteTag", () => {
    it("should delete a tag successfully", async () => {
      deleteTagMock.mockResolvedValue(mockDeleteResponse);

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useDeleteTag(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("tag-123");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(deleteTag).toHaveBeenCalledWith("tag-123");
      expect(result.current.data).toEqual(mockDeleteResponse);
    });

    it("should invalidate tag queries after success", async () => {
      deleteTagMock.mockResolvedValue(mockDeleteResponse);

      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteTag(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("tag-123");
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["tags"],
      });
    });

    it("should handle delete errors", async () => {
      deleteTagMock.mockRejectedValue(new Error("Delete failed"));

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useDeleteTag(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync("tag-123")).rejects.toThrow(
          "Delete failed",
        );
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
