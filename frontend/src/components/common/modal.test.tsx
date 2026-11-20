import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Modal from "./modal";

describe("Modal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: "Test Modal",
    children: <p>Modal content</p>,
  };

  it("renders modal when isOpen is true", () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render modal when isOpen is false", () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<Modal {...defaultProps} description="Test description" />);

    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<Modal {...defaultProps} />);

    expect(screen.queryByText("Test description")).not.toBeInTheDocument();
  });

  it("renders children", () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("has correct dialog accessibility attributes", () => {
    render(<Modal {...defaultProps} />);

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    const backdrop = screen.getByRole("dialog").parentElement!;

    fireEvent.mouseDown(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when modal content is clicked", () => {
    const onClose = vi.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.mouseDown(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close when closeOnBackdrop is false", () => {
    const onClose = vi.fn();

    render(
      <Modal {...defaultProps} onClose={onClose} closeOnBackdrop={false} />,
    );

    const backdrop = screen.getByRole("dialog").parentElement!;

    fireEvent.mouseDown(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when closeOnEscape is false", () => {
    const onClose = vi.fn();

    render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close when another key is pressed", () => {
    const onClose = vi.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Enter" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("applies the default md size", () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toHaveClass("max-w-md");
  });

  it.each([
    ["sm", "max-w-sm"],
    ["md", "max-w-md"],
    ["lg", "max-w-xl"],
    ["xl", "max-w-2xl"],
  ] as const)("applies the %s size", (size, expectedClass) => {
    render(<Modal {...defaultProps} size={size} />);

    expect(screen.getByRole("dialog")).toHaveClass(expectedClass);
  });
});
