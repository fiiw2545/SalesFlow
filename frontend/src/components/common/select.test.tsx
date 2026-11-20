import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Select from "./select";

const options = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Sales", value: "sales" },
];

describe("Select Component", () => {
  it("renders select element", () => {
    render(<Select options={options} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders label and associates it with select", () => {
    render(<Select label="Role" id="role" options={options} />);

    expect(screen.getByRole("combobox", { name: "Role" })).toHaveAttribute(
      "id",
      "role",
    );
  });

  it("uses name as select id when id is not provided", () => {
    render(<Select label="Role" name="role" options={options} />);

    expect(screen.getByRole("combobox", { name: "Role" })).toHaveAttribute(
      "id",
      "role",
    );
  });

  it("renders all options", () => {
    render(<Select options={options} />);

    expect(screen.getByRole("option", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Manager" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sales" })).toBeInTheDocument();
  });

  it("renders placeholder when provided", () => {
    render(<Select options={options} placeholder="Select a role" />);

    const placeholder = screen.getByRole("option", {
      name: "Select a role",
    });

    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveValue("");
    expect(placeholder).toBeDisabled();
  });

  it("does not render placeholder when not provided", () => {
    render(<Select options={options} />);

    expect(
      screen.queryByRole("option", { name: "Select a role" }),
    ).not.toBeInTheDocument();
  });

  it("shows required indicator", () => {
    render(<Select label="Role" required options={options} />);

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeRequired();
  });

  it("displays error message", () => {
    render(<Select options={options} error="Please select a role" />);

    expect(screen.getByText("Please select a role")).toBeInTheDocument();
  });

  it("applies error styles when error exists", () => {
    render(<Select options={options} error="Invalid role" />);

    expect(screen.getByRole("combobox")).toHaveClass("border-red-400");
  });

  it("shows helper text when there is no error", () => {
    render(<Select options={options} helperText="Choose your role" />);

    expect(screen.getByText("Choose your role")).toBeInTheDocument();
  });

  it("hides helper text when error exists", () => {
    render(
      <Select
        options={options}
        error="Invalid role"
        helperText="Choose your role"
      />,
    );

    expect(screen.getByText("Invalid role")).toBeInTheDocument();
    expect(screen.queryByText("Choose your role")).not.toBeInTheDocument();
  });

  it("supports disabled state", () => {
    render(<Select options={options} disabled />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("supports disabled individual options", () => {
    const customOptions = [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive", disabled: true },
    ];

    render(<Select options={customOptions} />);

    expect(screen.getByRole("option", { name: "Inactive" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Active" })).toBeEnabled();
  });

  it("calls onChange when user selects an option", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Select options={options} onChange={handleChange} />);

    const select = screen.getByRole("combobox");

    await user.selectOptions(select, "manager");

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(select).toHaveValue("manager");
  });
});
