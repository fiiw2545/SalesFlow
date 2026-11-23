import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

window.SALESFLOW_CONFIG = {
  API_BASE_URL: "http://localhost:8000",
};

afterEach(() => {
  cleanup();
});
