import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOrganization } from "../../organizations/context/organization.context";
import {
  getStages,
  getStage,
  createStage,
  updateStage,
  deleteStage,
} from "../services/stage.service";
import {
  useStages,
  useStage,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
} from "./use-stages";

import type {
  Stage,
  StagePayload,
  StageListResponse,
} from "../types/stage.types";

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("../services/stage.service", () => ({
  getStages: vi.fn(),
  getStage: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
}));

const mockStage: Stage = {
  id: "stage-123",
  pipeline_id: "pipeline-123",
  name: "New Lead",
  position: 1,
  probability: 10,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
};

const mockStageList: StageListResponse = {
  items: [mockStage],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockPayload: StagePayload = {
  name: "Qualified",
  position: 2,
  probability: 40,
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

describe("Stages Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);
  });

  describe("useStages", () => {
    it("should fetch stages successfully", async () => {
      vi.mocked(getStages).mockResolvedValue(mockStageList);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useStages("pipeline-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStageList);
      expect(getStages).toHaveBeenCalledWith("pipeline-123", 1, 10);
    });

    it("should use organization ID, pipeline ID, page and limit in query key", async () => {
      vi.mocked(getStages).mockResolvedValue(mockStageList);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useStages("pipeline-123", 2, 20), { wrapper });

      await waitFor(() => expect(getStages).toHaveBeenCalled());

      expect(
        queryClient.getQueryCache().find({
          queryKey: ["stages", "org-123", "pipeline-123", 2, 20],
        }),
      ).toBeDefined();
    });

    it("should not fetch when organization is not ready", () => {
      vi.mocked(useOrganization).mockReturnValue({
        activeOrganization: { id: "org-123" },
        isReady: false,
      } as ReturnType<typeof useOrganization>);

      const { wrapper } = createWrapper();

      renderHook(() => useStages("pipeline-123"), { wrapper });

      expect(getStages).not.toHaveBeenCalled();
    });

    it("should not fetch when there is no active organization", () => {
      vi.mocked(useOrganization).mockReturnValue({
        activeOrganization: null,
        isReady: true,
      } as ReturnType<typeof useOrganization>);

      const { wrapper } = createWrapper();

      renderHook(() => useStages("pipeline-123"), { wrapper });

      expect(getStages).not.toHaveBeenCalled();
    });

    it("should not fetch when pipeline ID is empty", () => {
      const { wrapper } = createWrapper();

      renderHook(() => useStages(""), { wrapper });

      expect(getStages).not.toHaveBeenCalled();
    });
  });

  describe("useStage", () => {
    it("should fetch a stage successfully", async () => {
      vi.mocked(getStage).mockResolvedValue(mockStage);
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useStage("pipeline-123", "stage-123"),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStage);
      expect(getStage).toHaveBeenCalledWith("pipeline-123", "stage-123");
    });

    it("should use organization ID, pipeline ID and stage ID in query key", async () => {
      vi.mocked(getStage).mockResolvedValue(mockStage);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useStage("pipeline-123", "stage-123"), { wrapper });

      await waitFor(() => expect(getStage).toHaveBeenCalled());

      expect(
        queryClient.getQueryCache().find({
          queryKey: ["stages", "org-123", "pipeline-123", "stage-123"],
        }),
      ).toBeDefined();
    });

    it("should not fetch when organization is not ready", () => {
      vi.mocked(useOrganization).mockReturnValue({
        activeOrganization: { id: "org-123" },
        isReady: false,
      } as ReturnType<typeof useOrganization>);

      const { wrapper } = createWrapper();

      renderHook(() => useStage("pipeline-123", "stage-123"), { wrapper });

      expect(getStage).not.toHaveBeenCalled();
    });

    it("should not fetch when there is no active organization", () => {
      vi.mocked(useOrganization).mockReturnValue({
        activeOrganization: null,
        isReady: true,
      } as ReturnType<typeof useOrganization>);

      const { wrapper } = createWrapper();

      renderHook(() => useStage("pipeline-123", "stage-123"), { wrapper });

      expect(getStage).not.toHaveBeenCalled();
    });

    it("should not fetch when pipeline ID is empty", () => {
      const { wrapper } = createWrapper();

      renderHook(() => useStage("", "stage-123"), { wrapper });

      expect(getStage).not.toHaveBeenCalled();
    });

    it("should not fetch when stage ID is empty", () => {
      const { wrapper } = createWrapper();

      renderHook(() => useStage("pipeline-123", ""), { wrapper });

      expect(getStage).not.toHaveBeenCalled();
    });
  });

  describe("useCreateStage", () => {
    it("should create a stage successfully", async () => {
      vi.mocked(createStage).mockResolvedValue(mockStage);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useCreateStage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          pipelineId: "pipeline-123",
          payload: mockPayload,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(createStage).toHaveBeenCalledWith("pipeline-123", mockPayload);
      expect(result.current.data).toEqual(mockStage);
    });

    it("should invalidate stage and pipeline queries after success", async () => {
      vi.mocked(createStage).mockResolvedValue(mockStage);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateStage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          pipelineId: "pipeline-123",
          payload: mockPayload,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["stages"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["pipelines"],
      });
    });

    it("should handle create errors", async () => {
      vi.mocked(createStage).mockRejectedValue(
        new Error("Create stage failed"),
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useCreateStage(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            pipelineId: "pipeline-123",
            payload: mockPayload,
          }),
        ).rejects.toThrow("Create stage failed");
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe("useUpdateStage", () => {
    it("should update a stage successfully", async () => {
      vi.mocked(updateStage).mockResolvedValue(mockStage);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdateStage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          pipelineId: "pipeline-123",
          stageId: "stage-123",
          payload: mockPayload,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(updateStage).toHaveBeenCalledWith(
        "pipeline-123",
        "stage-123",
        mockPayload,
      );
      expect(result.current.data).toEqual(mockStage);
    });

    it("should invalidate stage queries after success", async () => {
      vi.mocked(updateStage).mockResolvedValue(mockStage);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateStage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          pipelineId: "pipeline-123",
          stageId: "stage-123",
          payload: mockPayload,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["stages"],
      });
    });

    it("should handle update errors", async () => {
      vi.mocked(updateStage).mockRejectedValue(
        new Error("Update stage failed"),
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdateStage(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            pipelineId: "pipeline-123",
            stageId: "stage-123",
            payload: mockPayload,
          }),
        ).rejects.toThrow("Update stage failed");
      });
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe("useDeleteStage", () => {
    it("should delete a stage successfully", async () => {
      const response = { message: "Stage deleted successfully" };
      vi.mocked(deleteStage).mockResolvedValue(response);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useDeleteStage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          pipelineId: "pipeline-123",
          stageId: "stage-123",
        });
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(deleteStage).toHaveBeenCalledWith("pipeline-123", "stage-123");
      expect(result.current.data).toEqual(response);
    });

    it("should invalidate stage queries after success", async () => {
      vi.mocked(deleteStage).mockResolvedValue({
        message: "Stage deleted successfully",
      });
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteStage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          pipelineId: "pipeline-123",
          stageId: "stage-123",
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["stages"],
      });
    });

    it("should handle delete errors", async () => {
      vi.mocked(deleteStage).mockRejectedValue(
        new Error("Delete stage failed"),
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useDeleteStage(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            pipelineId: "pipeline-123",
            stageId: "stage-123",
          }),
        ).rejects.toThrow("Delete stage failed");
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
