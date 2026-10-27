import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScreenGallery, type GalleryItem } from "./ScreenGallery";
import { SCREEN_ALT } from "../lib/screens";

const ITEMS: GalleryItem[] = [
  { name: "portal-documents", caption: "Documents read on upload." },
  { name: "portal-banking", caption: "Bank statement analysis." },
  { name: "portal-fraud", caption: "A fraud score." },
];

function thumb(i: number) {
  return screen.getAllByRole("button", { name: /open full size/ })[i];
}

describe("screenshot gallery and lightbox", () => {
  it("shows lazy-loaded thumbnails with srcset and captions", () => {
    const { container } = render(<ScreenGallery label="Shots" items={ITEMS} />);
    expect(screen.getByRole("list", { name: "Shots" })).toHaveClass("gallery--grid");
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(3);
    imgs.forEach((img) => expect(img).toHaveAttribute("loading", "lazy"));
    expect(container.querySelectorAll('source[type="image/avif"][srcset*=","]')).toHaveLength(3);
    expect(screen.getByText("Bank statement analysis.")).toBeInTheDocument();
  });

  it("opens full size on click, with the caption, and Esc closes it and returns focus", async () => {
    const user = userEvent.setup();
    render(<ScreenGallery label="Shots" items={ITEMS} />);
    await user.click(thumb(1));
    const dialog = screen.getByRole("dialog", { name: "Bank statement analysis." });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Image 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Close/ })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(thumb(1)).toHaveFocus();
  });

  it("opens from the keyboard and the arrow keys move between images, wrapping round", async () => {
    const user = userEvent.setup();
    render(<ScreenGallery label="Shots" items={ITEMS} />);
    thumb(0).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Documents read on upload." })).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    const dialog = screen.getByRole("dialog", { name: "Bank statement analysis." });
    expect(within(dialog).getByRole("img", { name: SCREEN_ALT["portal-banking"] })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("dialog", { name: "A fraud score." })).toBeInTheDocument();
  });

  it("keeps focus inside the dialog", async () => {
    const user = userEvent.setup();
    render(<ScreenGallery label="Shots" items={ITEMS} />);
    await user.click(thumb(0));
    const close = screen.getByRole("button", { name: /Close/ });
    const next = screen.getByRole("button", { name: /Next/ });
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(next).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
  });

  it("the Close button and a swipe work", async () => {
    const user = userEvent.setup();
    render(<ScreenGallery label="Shots" items={ITEMS} />);
    await user.click(thumb(0));
    const dialog = screen.getByRole("dialog");
    fireEvent.touchStart(dialog, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 100 }] });
    expect(screen.getByRole("dialog", { name: "Bank statement analysis." })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Close/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
