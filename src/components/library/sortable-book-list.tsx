import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { moveId, type Book } from "@/lib/books";
import { cn } from "@/lib/utils";

import { BookCard } from "./book-card";

interface SortableBookListProps {
  books: Book[];
  onOpen: (book: Book) => void;
  /** Called with the full new id order after a drop. */
  onReorder: (orderedIds: string[]) => void;
  /** When false the handles are hidden (e.g. while a search or filter is active). */
  enabled: boolean;
}

function SortableItem({
  book,
  index,
  onOpen,
  enabled,
}: {
  book: Book;
  index: number;
  onOpen: (book: Book) => void;
  enabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: book.id, disabled: !enabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-90 [&>div]:border-primary/60 [&>div]:shadow-lift")}
    >
      <BookCard
        book={book}
        index={index}
        onOpen={onOpen}
        handle={
          enabled ? (
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={`Trascina per spostare "${book.titolo}"`}
              className="flex w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-r-xl border-l border-border/60 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary active:cursor-grabbing focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <GripVertical className="size-5" />
            </button>
          ) : null
        }
      />
    </div>
  );
}

/** "Da leggere" list that can be reordered by dragging the handle (mouse, touch or keyboard). */
export function SortableBookList({ books, onOpen, onReorder, enabled }: SortableBookListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = books.map((b) => b.id);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onReorder(moveId(ids, String(active.id), String(over.id)));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="grid gap-3">
          {books.map((b, i) => (
            <SortableItem key={b.id} book={b} index={i} onOpen={onOpen} enabled={enabled} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
