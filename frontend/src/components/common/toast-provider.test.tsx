import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ToastProvider, useToast } from "./toast-provider";

function TestConsumer() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast("Success message", "success")}>
        Show success
      </button>

      <button onClick={() => showToast("Error message", "error")}>
        Show error
      </button>

      <button onClick={() => showToast("First message", "success")}>
        Show first
      </button>

      <button onClick={() => showToast("Second message", "success")}>
        Show second
      </button>
    </div>
  );
}

function TestApp() {
  return (
    <ToastProvider>
      <TestConsumer />
    </ToastProvider>
  );
}

function InvalidConsumer() {
  useToast();
  return null;
}

describe("ToastProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children inside ToastProvider", () => {
    render(
      <ToastProvider>
        <p>Test children</p>
      </ToastProvider>,
    );

    expect(screen.getByText("Test children")).toBeInTheDocument();
  });

  it("provides showToast inside ToastProvider", () => {
    render(<TestApp />);

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("throws an error when useToast is used outside ToastProvider", () => {
    expect(() => render(<InvalidConsumer />)).toThrow(
      "useToast must be used within ToastProvider",
    );
  });

  it("displays success toast with status role", () => {
    render(<TestApp />);

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("displays error toast with alert role", () => {
    render(<TestApp />);

    fireEvent.click(screen.getByRole("button", { name: "Show error" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("displays the correct toast message", () => {
    render(<TestApp />);

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("closes toast when close button is clicked", () => {
    render(<TestApp />);

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    expect(screen.getByRole("status")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close notification" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("automatically dismisses toast after 3 seconds", () => {
    vi.useFakeTimers();

    render(<TestApp />);

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps toast visible before 3 seconds", () => {
    vi.useFakeTimers();

    render(<TestApp />);

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    act(() => {
      vi.advanceTimersByTime(2999);
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("resets auto dismiss timer when a new toast is displayed", () => {
    vi.useFakeTimers();

    render(<TestApp />);

    fireEvent.click(screen.getByRole("button", { name: "Show first" }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole("button", { name: "Show second" }));

    expect(screen.getByText("Second message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("Second message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
