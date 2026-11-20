import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./button";

describe("Button Component", () => {
  it("renders button with children", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("uses primary variant by default", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button")).toHaveClass("bg-blue-600");
  });

  it("supports all variants", () => {
    const variants = [
      ["primary", "bg-blue-600"],
      ["secondary", "bg-slate-100"],
      ["danger", "bg-red-600"],
      ["outline", "border"],
      ["ghost", "bg-transparent"],
    ] as const;

    for (const [variant, expectedClass] of variants) {
      const { unmount } = render(<Button variant={variant}>Action</Button>);

      expect(screen.getByRole("button")).toHaveClass(expectedClass);

      unmount();
    }
  });

  it("uses md size by default", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button")).toHaveClass("h-10");
  });

  it("supports all sizes", () => {
    const sizes = [
      ["sm", "h-8"],
      ["md", "h-10"],
      ["lg", "h-11"],
    ] as const;

    for (const [size, expectedClass] of sizes) {
      const { unmount } = render(<Button size={size}>Action</Button>);

      expect(screen.getByRole("button")).toHaveClass(expectedClass);

      unmount();
    }
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Save</Button>);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();

    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("disables button when loading", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button loading onClick={handleClick}>
        Saving
      </Button>,
    );

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeInTheDocument();

    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("supports custom className", () => {
    render(<Button className="custom-class">Save</Button>);

    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("supports custom button type", () => {
    render(<Button type="submit">Submit</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
