import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CaretDown,
  CaretUp,
  Eye,
  EyeSlash,
  PencilSimple,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { admin, eq } from "@/lib/supabase";
import type { Category, ProjectRow } from "@/lib/site-content";
import {
  ConfirmButton,
  Field,
  LoadingRows,
  Notice,
  PanelHead,
  btnGhost,
  btnPrimary,
  chipClass,
  explain,
  fieldClass,
  iconBtn,
  isHttpUrl,
} from "./ui";

type Draft = {
  title: string;
  description: string;
  category_id: string;
  video_url: string;
  thumb_url: string;
  sort_order: string;
  is_published: boolean;
};

const emptyDraft = (category_id: string, sort_order: number): Draft => ({
  title: "",
  description: "",
  category_id,
  video_url: "",
  thumb_url: "",
  sort_order: String(sort_order),
  is_published: true,
});

export default function ProjectsPanel({ onExpired }: { onExpired: () => void }) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<string | null>(null); // project id, "new", or null
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        admin.select<Category>("categories", "select=id,label,tag,sort_order&order=sort_order.asc"),
        admin.select<ProjectRow>("projects", "select=*&order=sort_order.asc"),
      ]);
      setCategories(c);
      setProjects(p);
      setError("");
    } catch (e) {
      setError(explain(e, onExpired));
    }
  }, [onExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  const catLabel = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.label])), [categories]);

  const visible = useMemo(
    () => (projects ?? []).filter((p) => filter === "all" || p.category_id === filter),
    [projects, filter],
  );

  const nextOrder = () => Math.max(0, ...(projects ?? []).map((p) => p.sort_order)) + 1;

  const openNew = () => {
    const first = filter !== "all" ? filter : (categories?.[0]?.id ?? "");
    setDraft(emptyDraft(first, nextOrder()));
    setEditing("new");
    setFormError("");
  };

  const openEdit = (p: ProjectRow) => {
    setDraft({
      title: p.title,
      description: p.description,
      category_id: p.category_id,
      video_url: p.video_url,
      thumb_url: p.thumb_url,
      sort_order: String(p.sort_order),
      is_published: p.is_published,
    });
    setEditing(p.id);
    setFormError("");
  };

  const close = () => {
    setEditing(null);
    setDraft(null);
    setFormError("");
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !editing) return;
    const title = draft.title.trim();
    if (!title) return setFormError("Add a title.");
    if (!draft.category_id) return setFormError("Choose a category.");
    if (!isHttpUrl(draft.video_url)) return setFormError("Paste a video link that starts with https://");
    if (!isHttpUrl(draft.thumb_url)) return setFormError("Paste a thumbnail link that starts with https://");
    const order = Number.parseInt(draft.sort_order, 10);
    if (!Number.isFinite(order)) return setFormError("Order must be a number.");

    const row = {
      title,
      description: draft.description.trim(),
      category_id: draft.category_id,
      video_url: draft.video_url.trim(),
      thumb_url: draft.thumb_url.trim(),
      sort_order: order,
      is_published: draft.is_published,
    };

    setBusy("save");
    setFormError("");
    try {
      if (editing === "new") await admin.insert("projects", row);
      else await admin.update("projects", eq("id", editing), row);
      toast.success(editing === "new" ? "Project added." : "Project saved.");
      close();
      await load();
    } catch (err) {
      setFormError(explain(err, onExpired));
    } finally {
      setBusy(null);
    }
  };

  const patch = async (p: ProjectRow, changes: Partial<ProjectRow>) => {
    setBusy(p.id);
    setError("");
    try {
      await admin.update("projects", eq("id", p.id), changes);
      await load();
    } catch (err) {
      setError(explain(err, onExpired));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (p: ProjectRow) => {
    setBusy(p.id);
    setError("");
    try {
      await admin.remove("projects", eq("id", p.id));
      toast.success("Project deleted.");
      await load();
    } catch (err) {
      setError(explain(err, onExpired));
    } finally {
      setBusy(null);
    }
  };

  /** Swap order with the neighbour in the same category. */
  const move = async (p: ProjectRow, dir: -1 | 1) => {
    const siblings = (projects ?? [])
      .filter((x) => x.category_id === p.category_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const i = siblings.findIndex((x) => x.id === p.id);
    const other = siblings[i + dir];
    if (!other) return;
    let a = other.sort_order;
    let b = p.sort_order;
    if (a === b) a += dir; // equal orders: nudge so the move is visible
    setBusy(p.id);
    setError("");
    try {
      await admin.update("projects", eq("id", p.id), { sort_order: a });
      await admin.update("projects", eq("id", other.id), { sort_order: b });
      await load();
    } catch (err) {
      setError(explain(err, onExpired));
    } finally {
      setBusy(null);
    }
  };

  const loading = projects === null || categories === null;

  return (
    <div className="grid gap-8">
      <PanelHead eyebrow="Portfolio" title="Your" accent="projects">
        <button type="button" onClick={openNew} disabled={!categories?.length} className={btnPrimary}>
          <Plus size={16} weight="light" /> Add project
        </button>
      </PanelHead>

      {error && <Notice>{error}</Notice>}

      {draft && editing && (
        <form onSubmit={save} className="glass grid gap-5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-lg font-light tracking-tight">
              {editing === "new" ? "New project" : "Edit project"}
            </p>
            <button type="button" onClick={close} aria-label="Close form" className={iconBtn}>
              <X size={16} weight="light" />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="p-title" label="Title">
              <input
                id="p-title"
                required
                maxLength={160}
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field id="p-cat" label="Category">
              <select
                id="p-cat"
                required
                value={draft.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                className={fieldClass}
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field id="p-desc" label="Description">
            <textarea
              id="p-desc"
              rows={3}
              maxLength={1000}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${fieldClass} resize-none`}
            />
          </Field>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid gap-3">
              <Field
                id="p-video"
                label="Video link"
                hint="A direct link to the video file (.mp4 or .webm)."
              >
                <input
                  id="p-video"
                  type="url"
                  required
                  placeholder="https://"
                  value={draft.video_url}
                  onChange={(e) => set("video_url", e.target.value)}
                  className={fieldClass}
                />
              </Field>
              {isHttpUrl(draft.video_url) && (
                <video
                  key={draft.video_url}
                  src={draft.video_url}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full rounded-2xl border border-border bg-secondary object-contain"
                />
              )}
            </div>
            <div className="grid gap-3">
              <Field id="p-thumb" label="Thumbnail link" hint="An image link (.jpg, .png or .webp).">
                <input
                  id="p-thumb"
                  type="url"
                  required
                  placeholder="https://"
                  value={draft.thumb_url}
                  onChange={(e) => set("thumb_url", e.target.value)}
                  className={fieldClass}
                />
              </Field>
              {isHttpUrl(draft.thumb_url) && (
                <img
                  key={draft.thumb_url}
                  src={draft.thumb_url}
                  alt="Thumbnail preview"
                  className="aspect-video w-full rounded-2xl border border-border bg-secondary object-cover"
                />
              )}
            </div>
          </div>

          <div className="grid items-end gap-5 sm:grid-cols-2">
            <Field id="p-order" label="Order" hint="Lower numbers show first inside the category.">
              <input
                id="p-order"
                type="number"
                step={1}
                value={draft.sort_order}
                onChange={(e) => set("sort_order", e.target.value)}
                className={fieldClass}
              />
            </Field>
            <label className="flex items-center gap-3 pb-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Show on the website
            </label>
          </div>

          {formError && <Notice>{formError}</Notice>}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy === "save"} className={btnPrimary}>
              {busy === "save" ? "Saving..." : "Save project"}
            </button>
            <button type="button" onClick={close} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {categories && categories.length === 0 && (
        <Notice tone="info">Create a category first, then you can add projects to it.</Notice>
      )}

      {categories && categories.length > 0 && (
        <div className="overflow-x-auto">
          <div role="tablist" aria-label="Filter by category" className="inline-flex min-w-full gap-1 border-b border-border sm:min-w-0 sm:gap-2">
            {[{ id: "all", label: "All" }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={filter === c.id}
                onClick={() => setFilter(c.id)}
                className={`relative whitespace-nowrap px-4 py-3 text-[11px] uppercase tracking-[0.28em] transition-colors duration-300 sm:px-6 sm:text-xs ${
                  filter === c.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
                {filter === c.id && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-primary glow-ring" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && !error ? (
        <LoadingRows />
      ) : (
        <div className="grid gap-3">
          {visible.length === 0 && categories && categories.length > 0 && (
            <div className="glass rounded-2xl px-6 py-10 text-center text-sm text-muted-foreground">
              No projects here yet. Use “Add project” to put the first one in.
            </div>
          )}
          {visible.map((p, i) => (
            <article
              key={p.id}
              className={`glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center ${
                p.is_published ? "" : "opacity-65"
              }`}
            >
              <img
                src={p.thumb_url}
                alt=""
                loading="lazy"
                className="aspect-video w-full rounded-xl border border-border bg-secondary object-cover sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-medium">{p.title}</h3>
                  <span className={chipClass}>{catLabel.get(p.category_id) ?? p.category_id}</span>
                  {!p.is_published && <span className={chipClass}>Hidden</span>}
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={busy === p.id || i === 0 || filter === "all"}
                  title={filter === "all" ? "Pick a category tab to reorder" : "Move up"}
                  onClick={() => void move(p, -1)}
                  className={iconBtn}
                >
                  <CaretUp size={16} weight="light" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={busy === p.id || i === visible.length - 1 || filter === "all"}
                  title={filter === "all" ? "Pick a category tab to reorder" : "Move down"}
                  onClick={() => void move(p, 1)}
                  className={iconBtn}
                >
                  <CaretDown size={16} weight="light" />
                </button>
                <button
                  type="button"
                  aria-label={p.is_published ? "Hide from website" : "Show on website"}
                  title={p.is_published ? "Hide from website" : "Show on website"}
                  disabled={busy === p.id}
                  onClick={() => void patch(p, { is_published: !p.is_published })}
                  className={iconBtn}
                >
                  {p.is_published ? <Eye size={16} weight="light" /> : <EyeSlash size={16} weight="light" />}
                </button>
                <button
                  type="button"
                  aria-label="Edit project"
                  disabled={busy === p.id}
                  onClick={() => openEdit(p)}
                  className={iconBtn}
                >
                  <PencilSimple size={16} weight="light" />
                </button>
                <ConfirmButton disabled={busy === p.id} onConfirm={() => void remove(p)} label="Delete project">
                  <Trash size={16} weight="light" />
                </ConfirmButton>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
