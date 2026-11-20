import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Badge from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);

    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("uses default variant when variant is not provided", () => {
    render(<Badge>Default Badge</Badge>);

    const badge = screen.getByText("Default Badge");

    expect(badge).toHaveClass("bg-slate-100");
    expect(badge).toHaveClass("text-slate-700");
  });

  it.each([
    ["default", "bg-slate-100", "text-slate-700"],
    ["primary", "bg-blue-100", "text-blue-700"],
    ["success", "bg-green-100", "text-green-700"],
    ["warning", "bg-amber-100", "text-amber-700"],
    ["danger", "bg-red-100", "text-red-700"],
    ["info", "bg-cyan-100", "text-cyan-700"],
  ] as const)(
    "applies the %s variant",
    (variant, backgroundClass, textClass) => {
      render(<Badge variant={variant}>Test Badge</Badge>);

      const badge = screen.getByText("Test Badge");

      expect(badge).toHaveClass(backgroundClass);
      expect(badge).toHaveClass(textClass);
    },
  );

  it("applies custom className", () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);

    expect(screen.getByText("Custom Badge")).toHaveClass("custom-class");
  });

  it("combines variant classes with custom className", () => {
    render(
      <Badge variant="primary" className="custom-class">
        Combined Badge
      </Badge>,
    );

    const badge = screen.getByText("Combined Badge");

    expect(badge).toHaveClass("bg-blue-100");
    expect(badge).toHaveClass("text-blue-700");
    expect(badge).toHaveClass("custom-class");
  });

  it("renders ReactNode children", () => {
    render(
      <Badge>
        <span>Nested Content</span>
      </Badge>,
    );

    expect(screen.getByText("Nested Content")).toBeInTheDocument();
  });

  it("renders as a span element", () => {
    render(<Badge>Span Badge</Badge>);

    expect(screen.getByText("Span Badge").tagName).toBe("SPAN");
  });
});
