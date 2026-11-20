import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from "../services/note.service";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  useNotes,
  useNote,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "./use-notes";

import type { Note, NoteListResponse, NotePayload } from "../types/note.types";

vi.mock("../services/note.service", () => ({
  getNotes: vi.fn(),
  getNote: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const mockOrganization = {
  id: "org-123",
  name: "Test Organization",
};

const mockNote: Note = {
  id: "note-123",
  title: "Meeting Notes",
  content: "Discuss project progress",
  company_id: "companies:company-123",
  contact_id: "contacts:contact-123",
  deal_id: null,
  organization_id: "org-123",
  created_by: "user-123",
  created_at: "2026-11-19T10:00:00Z",
  updated_at: null,
};

const mockNoteList: NoteListResponse = {
  items: [mockNote],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockPayload: NotePayload = {
  title: "New Note",
  content: "New note content",
  company_id: "companies:company-123",
  contact_id: "contacts:contact-123",
  deal_id: null,
};

const mockCreatedNote: Note = {
  ...mockNote,
  id: "note-456",
  title: "New Note",
  content: "New note content",
};

const mockUpdatedNote: Note = {
  ...mockNote,
  title: "Updated Note",
  content: "Updated content",
};

const mockDeleteResponse = {
  message: "Note deleted successfully",
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

function mockOrganizationContext(
  overrides: Partial<{
    activeOrganization: typeof mockOrganization | null;
    isReady: boolean;
  }> = {},
) {
  vi.mocked(useOrganization).mockReturnValue({
    activeOrganization: mockOrganization,
    isReady: true,
    ...overrides,
  } as ReturnType<typeof useOrganization>);
}

describe("useNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationContext();
  });

  it("should fetch notes successfully", async () => {
    vi.mocked(getNotes).mockResolvedValue(mockNoteList);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotes(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getNotes).toHaveBeenCalledWith(1, 10);
    expect(result.current.data).toEqual(mockNoteList);
  });

  it("should use custom page and limit", async () => {
    vi.mocked(getNotes).mockResolvedValue({
      ...mockNoteList,
      page: 2,
      limit: 20,
    });

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotes(2, 20), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getNotes).toHaveBeenCalledWith(2, 20);
  });

  it("should include organization, page and limit in query key", async () => {
    vi.mocked(getNotes).mockResolvedValue(mockNoteList);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useNotes(2, 20), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["notes", "org-123", 2, 20]),
      ).toBeDefined();
    });
  });

  it("should not fetch when organization context is not ready", () => {
    mockOrganizationContext({ isReady: false });
    const { wrapper } = createWrapper();

    renderHook(() => useNotes(), { wrapper });

    expect(getNotes).not.toHaveBeenCalled();
  });

  it("should not fetch without active organization", () => {
    mockOrganizationContext({ activeOrganization: null });
    const { wrapper } = createWrapper();

    renderHook(() => useNotes(), { wrapper });

    expect(getNotes).not.toHaveBeenCalled();
  });

  it("should handle fetch error", async () => {
    vi.mocked(getNotes).mockRejectedValue(new Error("Fetch notes failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotes(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error("Fetch notes failed"));
  });
});

describe("useNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationContext();
  });

  it("should fetch a note successfully", async () => {
    vi.mocked(getNote).mockResolvedValue(mockNote);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNote("note-123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getNote).toHaveBeenCalledWith("note-123");
    expect(result.current.data).toEqual(mockNote);
  });

  it("should include organization and note ID in query key", async () => {
    vi.mocked(getNote).mockResolvedValue(mockNote);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useNote("note-123"), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["notes", "org-123", "note-123"]),
      ).toBeDefined();
    });
  });

  it("should not fetch when organization context is not ready", () => {
    mockOrganizationContext({ isReady: false });
    const { wrapper } = createWrapper();

    renderHook(() => useNote("note-123"), { wrapper });

    expect(getNote).not.toHaveBeenCalled();
  });

  it("should not fetch without active organization", () => {
    mockOrganizationContext({ activeOrganization: null });
    const { wrapper } = createWrapper();

    renderHook(() => useNote("note-123"), { wrapper });

    expect(getNote).not.toHaveBeenCalled();
  });

  it("should not fetch without note ID", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useNote(""), { wrapper });

    expect(getNote).not.toHaveBeenCalled();
  });

  it("should handle fetch error", async () => {
    vi.mocked(getNote).mockRejectedValue(new Error("Fetch note failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNote("note-123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error("Fetch note failed"));
  });
});

describe("useCreateNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create note successfully", async () => {
    vi.mocked(createNote).mockResolvedValue(mockCreatedNote);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockPayload);
    });

    expect(createNote).toHaveBeenCalledWith(mockPayload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCreatedNote);
  });

  it("should invalidate notes query after success", async () => {
    vi.mocked(createNote).mockResolvedValue(mockCreatedNote);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockPayload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["notes"],
    });
  });

  it("should handle create error", async () => {
    vi.mocked(createNote).mockRejectedValue(new Error("Create note failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateNote(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(mockPayload)).rejects.toThrow(
        "Create note failed",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUpdateNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update note successfully", async () => {
    vi.mocked(updateNote).mockResolvedValue(mockUpdatedNote);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "note-123",
        payload: mockPayload,
      });
    });

    expect(updateNote).toHaveBeenCalledWith("note-123", mockPayload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUpdatedNote);
  });

  it("should invalidate notes query after success", async () => {
    vi.mocked(updateNote).mockResolvedValue(mockUpdatedNote);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "note-123",
        payload: mockPayload,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["notes"],
    });
  });

  it("should handle update error", async () => {
    vi.mocked(updateNote).mockRejectedValue(new Error("Update note failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateNote(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: "note-123",
          payload: mockPayload,
        }),
      ).rejects.toThrow("Update note failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDeleteNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete note successfully", async () => {
    vi.mocked(deleteNote).mockResolvedValue(mockDeleteResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("note-123");
    });

    expect(deleteNote).toHaveBeenCalledWith("note-123");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDeleteResponse);
  });

  it("should invalidate notes query after success", async () => {
    vi.mocked(deleteNote).mockResolvedValue(mockDeleteResponse);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("note-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["notes"],
    });
  });

  it("should handle delete error", async () => {
    vi.mocked(deleteNote).mockRejectedValue(new Error("Delete note failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteNote(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("note-123")).rejects.toThrow(
        "Delete note failed",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
