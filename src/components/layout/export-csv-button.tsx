import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { booksToCsv, type Book } from "@/lib/books";

export function ExportCsvButton({ books }: { books: Book[] }) {
  function exportCsv() {
    if (books.length === 0) {
      toast("Nessun libro da esportare");
      return;
    }
    // BOM so Excel reads accented characters correctly.
    const blob = new Blob(["\uFEFF" + booksToCsv(books)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `libreria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Esportati ${books.length} libri`);
  }

  return (
    <Button variant="soft" size="sm" onClick={exportCsv}>
      <Download /> <span className="hidden sm:inline">Esporta CSV</span>
    </Button>
  );
}
