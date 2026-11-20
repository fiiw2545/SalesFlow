import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ComingSoon from "./coming-soon";

describe("ComingSoon", () => {
  it("renders the title", () => {
    render(<ComingSoon title="Reports" />);

    expect(
      screen.getByRole("heading", { name: "Reports" }),
    ).toBeInTheDocument();
  });

  it("renders the default description when description is not provided", () => {
    render(<ComingSoon title="Reports" />);

    expect(
      screen.getByText("This feature is currently under development."),
    ).toBeInTheDocument();
  });

  it("renders a custom description", () => {
    render(
      <ComingSoon
        title="Reports"
        description="Reports feature is coming soon."
      />,
    );

    expect(
      screen.getByText("Reports feature is coming soon."),
    ).toBeInTheDocument();
  });

  it("does not render the default description when a custom description is provided", () => {
    render(<ComingSoon title="Reports" description="Custom description" />);

    expect(
      screen.queryByText("This feature is currently under development."),
    ).not.toBeInTheDocument();
  });

  it("renders title as an h2 heading", () => {
    render(<ComingSoon title="Reports" />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Reports",
    );
  });

  it("renders description as a paragraph", () => {
    render(<ComingSoon title="Reports" />);

    expect(
      screen.getByText("This feature is currently under development.").tagName,
    ).toBe("P");
  });
});
