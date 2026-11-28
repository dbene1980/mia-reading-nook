import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookCard } from "@/components/library/book-card";
import type { Book } from "@/lib/books";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "b1",
    user_id: "u1",
    titolo: "Il nome della rosa",
    autore: "Umberto Eco",
    stato: "DA SCARICARE",
    descrizione: null,
    note: null,
    letto: false,
    data_fine_libro: null,
    rating: null,
    tipo: "EBOOK",
    copertina_url: null,
    posizione: 1,
    pagine: 503,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

describe("BookCard", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("copies title and author when pressing the magnet button without opening the book", async () => {
    const onOpen = vi.fn();
    render(<BookCard book={makeBook()} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole("button", { name: /copia titolo e autore di/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Il nome della rosa Umberto Eco");
    });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("opens the book when clicking the card body", () => {
    const onOpen = vi.fn();
    const book = makeBook();
    render(<BookCard book={book} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole("heading", { name: "Il nome della rosa" }));

    expect(onOpen).toHaveBeenCalledWith(book);
  });
});
