import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Textarea from "./textarea";

describe("Textarea Component", () => {
  it("renders textarea", () => {
    render(<Textarea />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label and associates it with textarea", () => {
    render(<Textarea label="Description" id="description" />);

    expect(
      screen.getByRole("textbox", { name: "Description" }),
    ).toHaveAttribute("id", "description");
  });

  it("uses name as textarea id when id is not provided", () => {
    render(<Textarea label="Description" name="description" />);

    expect(
      screen.getByRole("textbox", { name: "Description" }),
    ).toHaveAttribute("id", "description");
  });

  it("uses 4 rows by default", () => {
    render(<Textarea />);

    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "4");
  });

  it("supports custom rows", () => {
    render(<Textarea rows={8} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "8");
  });

  it("shows required indicator", () => {
    render(<Textarea label="Description" required />);

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("displays error message", () => {
    render(<Textarea error="Description is required" />);

    expect(screen.getByText("Description is required")).toBeInTheDocument();
  });

  it("applies error styles when error exists", () => {
    render(<Textarea error="Invalid description" />);

    expect(screen.getByRole("textbox")).toHaveClass("border-red-400");
  });

  it("shows helper text when there is no error", () => {
    render(<Textarea helperText="Enter a short description" />);

    expect(screen.getByText("Enter a short description")).toBeInTheDocument();
  });

  it("hides helper text when error exists", () => {
    render(
      <Textarea
        error="Invalid description"
        helperText="Enter a short description"
      />,
    );

    expect(screen.getByText("Invalid description")).toBeInTheDocument();
    expect(
      screen.queryByText("Enter a short description"),
    ).not.toBeInTheDocument();
  });

  it("supports placeholder", () => {
    render(<Textarea placeholder="Enter description" />);

    expect(
      screen.getByPlaceholderText("Enter description"),
    ).toBeInTheDocument();
  });

  it("supports disabled state", () => {
    render(<Textarea disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("supports custom className", () => {
    render(<Textarea className="custom-class" />);

    expect(screen.getByRole("textbox")).toHaveClass("custom-class");
  });

  it("calls onChange when user types multiline text", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Textarea onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");

    await user.type(textarea, "First line{Enter}Second line");

    expect(handleChange).toHaveBeenCalled();
    expect(textarea).toHaveValue("First line\nSecond line");
  });
});
