import { render, screen } from "@testing-library/react";
import { NativeScreen, Screenshot } from "./Screenshot";
import { SCREEN_ALT, screenSources, type ScreenName } from "../lib/screens";
import sizes from "../assets/screens/sizes.json";

describe("real app screenshots", () => {
  it("every screen has its files and alt text", () => {
    for (const name of Object.keys(sizes) as ScreenName[]) {
      const s = screenSources(name);
      expect(s, name).not.toBeNull();
      expect(s!.avif.split(",")).toHaveLength(2);
      expect(s!.webp.split(",")).toHaveLength(2);
      expect(SCREEN_ALT[name].length, name).toBeGreaterThan(20);
    }
  });

  it("renders avif and webp with a lazy PNG fallback, sized", () => {
    const { container } = render(<Screenshot name="portal-pipeline" caption="Pipeline" />);
    const img = screen.getByRole("img", { name: SCREEN_ALT["portal-pipeline"] });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "800");
    expect(container.querySelector('source[type="image/avif"]')).not.toBeNull();
    expect(container.querySelector('source[type="image/webp"]')).not.toBeNull();
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
  });

  it("shows the drawing until a native screenshot is added", () => {
    render(
      <NativeScreen slot="iphone-dialler" alt="Dialler">
        <div>drawing</div>
      </NativeScreen>,
    );
    expect(screen.getByText("drawing")).toBeInTheDocument();
  });
});
