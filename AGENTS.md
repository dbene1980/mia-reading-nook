<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Book domain logic (filters, stats, CSV export) lives as pure functions in `src/lib/books.ts`, covered by `src/test/books.test.ts`; pages only compose them — keeps rules testable without the database.
- All database access for books goes through `src/lib/books-data.ts` hooks (`useBooks`, `useBookMutations`); swapping the backend touches only that file.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/auth`) and wrap content in `AppShell` (sidebar + header with CSV export and sign-out); the gate stays a bare `<Outlet />`.
- Backend is the user's own Supabase project; the browser client talks to `books` directly and RLS (`auth.uid() = user_id`) is the only access control, so no server functions are needed for book CRUD.
- Book lookup in the add dialog tries Google Books, then falls back to Open Library on any Google failure (rate limits are common without a key); both are public keyless APIs called from the browser, with parsing in `src/lib/google-books.ts` / `src/lib/open-library.ts` and the fallback in `src/lib/book-search.ts`, covered by tests in `src/test/`.
- Mobile (<768px) hides the sidebar and uses a fixed bottom bar with a quick-add button, both fed by `src/components/layout/nav-items.ts`; page content keeps bottom padding so the bar never covers it.
- "Da leggere" order is the `posizione` column (ascending); drag-and-drop uses @dnd-kit sortable with a handle, saves only changed rows via `savePositions`, and is disabled while search/filter is active so positions always refer to the full list; new or un-read books go to the end.
- Reading statistics (`readingStats`, `readingYears`) are pure functions in `src/lib/books.ts` based on `letto = true` and `data_fine_libro`; the Statistiche page only renders them.

- Brand marks (logo, Ex Libris seal, star ornaments) live in `src/components/brand/`; the single source icon is `public/icon.svg`, and favicon/PWA PNGs are rendered from it with `rsvg-convert` — redraw once, regenerate the rest.
- Home-screen install is manifest-only (`public/manifest.webmanifest` + head links in `__root.tsx`); no service worker, since offline was not requested.
