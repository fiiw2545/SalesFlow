import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "./input";

describe("Input Component", () => {
  it("renders input", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label and associates it with input", () => {
    render(<Input label="Email" id="email" />);

    const input = screen.getByRole("textbox", { name: "Email" });

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "email");
  });

  it("uses name as input id when id is not provided", () => {
    render(<Input label="Username" name="username" />);

    expect(screen.getByRole("textbox", { name: "Username" })).toHaveAttribute(
      "id",
      "username",
    );
  });

  it("shows required indicator", () => {
    render(<Input label="Email" required />);

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("displays error message", () => {
    render(<Input label="Email" error="Invalid email" />);

    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("applies error styles when error exists", () => {
    render(<Input error="Invalid email" />);

    expect(screen.getByRole("textbox")).toHaveClass("border-red-400");
  });

  it("shows helper text when there is no error", () => {
    render(<Input helperText="Enter your email address" />);

    expect(screen.getByText("Enter your email address")).toBeInTheDocument();
  });

  it("hides helper text when error exists", () => {
    render(
      <Input error="Invalid email" helperText="Enter your email address" />,
    );

    expect(screen.getByText("Invalid email")).toBeInTheDocument();
    expect(
      screen.queryByText("Enter your email address"),
    ).not.toBeInTheDocument();
  });

  it("supports placeholder", () => {
    render(<Input placeholder="Enter email" />);

    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("supports custom className", () => {
    render(<Input className="custom-class" />);

    expect(screen.getByRole("textbox")).toHaveClass("custom-class");
  });

  it("supports disabled state", () => {
    render(<Input disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("calls onChange when user types", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input onChange={handleChange} />);

    await user.type(screen.getByRole("textbox"), "test@example.com");

    expect(handleChange).toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("test@example.com");
  });
});
