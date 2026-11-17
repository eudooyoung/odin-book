import { render, screen } from "@testing-library/react";
import App from "./App";

describe("Application", () => {
  it("renders the app title", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /odin book/i })).toBeInTheDocument();
  });
});
