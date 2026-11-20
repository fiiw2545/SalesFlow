import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOrganization } from "../../organizations/context/organization.context";
import {
  getPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
} from "../services/pipeline.service";
import {
  usePipelines,
  usePipeline,
  useCreatePipeline,
  useUpdatePipeline,
  useDeletePipeline,
} from "./use-pipelines";

import type {
  Pipeline,
  PipelinePayload,
  PipelineListResponse,
} from "../types/pipeline.types";

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("../services/pipeline.service", () => ({
  getPipelines: vi.fn(),
  getPipeline: vi.fn(),
  createPipeline: vi.fn(),
  updatePipeline: vi.fn(),
  deletePipeline: vi.fn(),
}));

const mockPipeline: Pipeline = {
  id: "pipeline-123",
  name: "Sales Pipeline",
  description: "Main sales pipeline",
  is_default: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
};

const mockPipelineList: PipelineListResponse = {
  items: [mockPipeline],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockPayload: PipelinePayload = {
  name: "New Pipeline",
  description: "New description",
  is_default: false,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { wrapper: Wrapper, queryClient };
}

describe("Pipelines Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);
  });

  describe("usePipelines", () => {
    it("should fetch pipelines successfully", async () => {
      vi.mocked(getPipelines).mockResolvedValue(mockPipelineList);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => usePipelines(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPipelineList);
      expect(getPipelines).toHaveBeenCalledWith(1, 10);
    });

    it("should use organization ID, page and limit in query key", async () => {
      vi.mocked(getPipelines).mockResolvedValue(mockPipelineList);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => usePipelines(2, 20), { wrapper });

      await waitFor(() => expect(getPipelines).toHaveBeenCalled());

      expect(
        queryClient.getQueryCache().find({
          queryKey: ["pipelines", "org-123", 2, 20],
        }),
      ).toBeDefined();
    });

    it("should not fetch when organization is not ready", () => {
      vi.mocked(useOrganization).mockReturnValue({
        activeOrganization: { id: "org-123" },
        isReady: false,
      } as ReturnType<typeof useOrganization>);

      const { wrapper } = createWrapper();

      renderHook(() => usePipelines(), { wrapper });

      expect(getPipelines).not.toHaveBeenCalled();
    });

    it("should not fetch when there is no active organization", () => {
      vi.mocked(useOrganization).mockReturnValue({
        activeOrganization: null,
        isReady: true,
      } as ReturnType<typeof useOrganization>);

      const { wrapper } = createWrapper();

      renderHook(() => usePipelines(), { wrapper });

      expect(getPipelines).not.toHaveBeenCalled();
    });
  });

  describe("usePipeline", () => {
    it("should fetch a pipeline successfully", async () => {
      vi.mocked(getPipeline).mockResolvedValue(mockPipeline);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => usePipeline("pipeline-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPipeline);
      expect(getPipeline).toHaveBeenCalledWith("pipeline-123");
    });

    it("should use organization ID and pipeline ID in query key", async () => {
      vi.mocked(getPipeline).mockResolvedValue(mockPipeline);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => usePipeline("pipeline-123"), { wrapper });

      await waitFor(() => expect(getPipeline).toHaveBeenCalled());

      expect(
        queryClient.getQueryCache().find({
          queryKey: ["pipelines", "org-123", "pipeline-123"],
        }),
      ).toBeDefined();
    });

    it("should not fetch when organization is not ready", () => {
      vi.mocked(useOrganization).mockReturnValue({
        activeOrganization: { id: "org-123" },
        isReady: false,
      } as ReturnType<typeof useOrganization>);

      const { wrapper } = createWrapper();

      renderHook(() => usePipeline("pipeline-123"), { wrapper });

      expect(getPipeline).not.toHaveBeenCalled();
    });

    it("should not fetch when there is no active organization", () => {
      vi.mocked(useOrganization).mockReturnValue({
        activeOrganization: null,
        isReady: true,
      } as ReturnType<typeof useOrganization>);

      const { wrapper } = createWrapper();

      renderHook(() => usePipeline("pipeline-123"), { wrapper });

      expect(getPipeline).not.toHaveBeenCalled();
    });

    it("should not fetch when pipeline ID is empty", () => {
      const { wrapper } = createWrapper();

      renderHook(() => usePipeline(""), { wrapper });

      expect(getPipeline).not.toHaveBeenCalled();
    });
  });

  describe("useCreatePipeline", () => {
    it("should create a pipeline successfully", async () => {
      vi.mocked(createPipeline).mockResolvedValue(mockPipeline);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useCreatePipeline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(createPipeline).toHaveBeenCalledWith(mockPayload);
      expect(result.current.data).toEqual(mockPipeline);
    });

    it("should invalidate pipeline queries after success", async () => {
      vi.mocked(createPipeline).mockResolvedValue(mockPipeline);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreatePipeline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["pipelines"],
      });
    });

    it("should handle create errors", async () => {
      const error = new Error("Create pipeline failed");
      vi.mocked(createPipeline).mockRejectedValue(error);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useCreatePipeline(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync(mockPayload)).rejects.toThrow(
          "Create pipeline failed",
        );
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe("useUpdatePipeline", () => {
    it("should update a pipeline successfully", async () => {
      vi.mocked(updatePipeline).mockResolvedValue(mockPipeline);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdatePipeline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: "pipeline-123",
          payload: mockPayload,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(updatePipeline).toHaveBeenCalledWith("pipeline-123", mockPayload);
      expect(result.current.data).toEqual(mockPipeline);
    });

    it("should invalidate pipeline queries after success", async () => {
      vi.mocked(updatePipeline).mockResolvedValue(mockPipeline);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdatePipeline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: "pipeline-123",
          payload: mockPayload,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["pipelines"],
      });
    });

    it("should handle update errors", async () => {
      vi.mocked(updatePipeline).mockRejectedValue(new Error("Update failed"));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdatePipeline(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            id: "pipeline-123",
            payload: mockPayload,
          }),
        ).rejects.toThrow("Update failed");
      });
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe("useDeletePipeline", () => {
    it("should delete a pipeline successfully", async () => {
      const response = { message: "Pipeline deleted successfully" };
      vi.mocked(deletePipeline).mockResolvedValue(response);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useDeletePipeline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("pipeline-123");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(deletePipeline).toHaveBeenCalledWith("pipeline-123");
      expect(result.current.data).toEqual(response);
    });

    it("should invalidate pipeline queries after success", async () => {
      vi.mocked(deletePipeline).mockResolvedValue({
        message: "Pipeline deleted successfully",
      });
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeletePipeline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("pipeline-123");
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["pipelines"],
      });
    });

    it("should handle delete errors", async () => {
      vi.mocked(deletePipeline).mockRejectedValue(new Error("Delete failed"));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useDeletePipeline(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync("pipeline-123"),
        ).rejects.toThrow("Delete failed");
      });
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isError).toBe(true);
    });
  });
});
