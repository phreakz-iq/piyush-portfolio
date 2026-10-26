import { useCallback, useEffect, useMemo, useState } from "react";
import { CaretDown, CaretUp, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { admin, eq } from "@/lib/supabase";
import type { Category } from "@/lib/site-content";
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
  slugify,
} from "./ui";

type Draft = { id: string; label: string; tag: string; sort_order: string };

export default function CategoriesPanel({ onExpired }: { onExpired: () => void }) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [editing, setEditing] = useState<string | null>(null); // category id, "new" or null
  const [draft, setDraft] = useState<Draft | null>(null);
  const [idTouched, setIdTouched] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        admin.select<Category>("categories", "select=id,label,tag,sort_order&order=sort_order.asc"),
        admin.select<{ category_id: string }>("projects", "select=category_id"),
      ]);
      const map = new Map<string, number>();
      for (const row of p) map.set(row.category_id, (map.get(row.category_id) ?? 0) + 1);
      setCategories(c);
      setCounts(map);
      setError("");
    } catch (e) {
      setError(explain(e, onExpired));
    }
  }, [onExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  const nextOrder = useMemo(
    () => Math.max(0, ...(categories ?? []).map((c) => c.sort_order)) + 1,
    [categories],
  );

  const openNew = () => {
    setDraft({ id: "", label: "", tag: "", sort_order: String(nextOrder) });
    setEditing("new");
    setIdTouched(false);
    setFormError("");
  };

  const openEdit = (c: Category) => {
    setDraft({ id: c.id, label: c.label, tag: c.tag, sort_order: String(c.sort_order) });
    setEditing(c.id);
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
    const label = draft.label.trim();
    const tag = draft.tag.trim() || label;
    const order = Number.parseInt(draft.sort_order, 10);
    if (!label) return setFormError("Add a name for the category.");
    if (!Number.isFinite(order)) return setFormError("Order must be a number.");
    const id = editing === "new" ? draft.id || slugify(label) : editing;
    if (!id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
      return setFormError("The ID can only use lowercase letters, numbers and dashes.");
    }

    setBusy("save");
    setFormError("");
    try {
      if (editing === "new") {
        await admin.insert("categories", { id, label, tag, sort_order: order });
      } else {
        await admin.update("categories", eq("id", editing), { label, tag, sort_order: order });
      }
      toast.success(editing === "new" ? "Category added." : "Category saved.");
      close();
      await load();
    } catch (err) {
      setFormError(explain(err, onExpired));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (c: Category) => {
    setBusy(c.id);
    setError("");
    try {
      await admin.remove("categories", eq("id", c.id));
      toast.success("Category deleted.");
      await load();
    } catch (err) {
      setError(explain(err, onExpired));
    } finally {
      setBusy(null);
    }
  };

  const move = async (c: Category, dir: -1 | 1) => {
    const list = categories ?? [];
    const i = list.findIndex((x) => x.id === c.id);
    const other = list[i + dir];
    if (!other) return;
    let a = other.sort_order;
    const b = c.sort_order;
    if (a === b) a += dir;
    setBusy(c.id);
    setError("");
    try {
      await admin.update("categories", eq("id", c.id), { sort_order: a });
      await admin.update("categories", eq("id", other.id), { sort_order: b });
      await load();
    } catch (err) {
      setError(explain(err, onExpired));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-8">
      <PanelHead eyebrow="Organise" title="Work" accent="categories">
        <button type="button" onClick={openNew} className={btnPrimary}>
          <Plus size={16} weight="light" /> Add category
        </button>
      </PanelHead>

      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Categories are the tabs in the Work section of your site. Put each project in one category
        from the Projects tab.
      </p>

      {error && <Notice>{error}</Notice>}

      {draft && editing && (
        <form onSubmit={save} className="glass grid gap-5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-lg font-light tracking-tight">
              {editing === "new" ? "New category" : "Edit category"}
            </p>
            <button type="button" onClick={close} aria-label="Close form" className={iconBtn}>
              <X size={16} weight="light" />
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="c-label" label="Tab name" hint="Shown on the tab, e.g. “Real Estate”.">
              <input
                id="c-label"
                required
                maxLength={60}
                value={draft.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setDraft((d) => (d ? { ...d, label, id: idTouched || editing !== "new" ? d.id : slugify(label) } : d));
                }}
                className={fieldClass}
              />
            </Field>
            <Field id="c-tag" label="Tag on cards" hint="Small label on each project card. Leave blank to reuse the tab name.">
              <input
                id="c-tag"
                maxLength={60}
                value={draft.tag}
                onChange={(e) => set("tag", e.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field
              id="c-id"
              label="ID"
              hint={editing === "new" ? "Made from the name. It can't be changed later." : "The ID can't be changed."}
            >
              <input
                id="c-id"
                value={draft.id}
                disabled={editing !== "new"}
                maxLength={60}
                onChange={(e) => {
                  setIdTouched(true);
                  set("id", e.target.value.toLowerCase());
                }}
                className={`${fieldClass} disabled:opacity-60`}
              />
            </Field>
            <Field id="c-order" label="Order" hint="Lower numbers come first.">
              <input
                id="c-order"
                type="number"
                step={1}
                value={draft.sort_order}
                onChange={(e) => set("sort_order", e.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>

          {formError && <Notice>{formError}</Notice>}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy === "save"} className={btnPrimary}>
              {busy === "save" ? "Saving..." : "Save category"}
            </button>
            <button type="button" onClick={close} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {categories === null && !error ? (
        <LoadingRows />
      ) : (
        <div className="grid gap-3">
          {categories?.length === 0 && (
            <div className="glass rounded-2xl px-6 py-10 text-center text-sm text-muted-foreground">
              No categories yet. Add one to start organising your work.
            </div>
          )}
          {categories?.map((c, i) => {
            const n = counts.get(c.id) ?? 0;
            return (
              <article key={c.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4 sm:px-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium">{c.label}</h3>
                    <span className={chipClass}>{c.tag}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {n} {n === 1 ? "project" : "projects"} · ID: {c.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={busy === c.id || i === 0}
                    onClick={() => void move(c, -1)}
                    className={iconBtn}
                  >
                    <CaretUp size={16} weight="light" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={busy === c.id || i === (categories?.length ?? 1) - 1}
                    onClick={() => void move(c, 1)}
                    className={iconBtn}
                  >
                    <CaretDown size={16} weight="light" />
                  </button>
                  <button
                    type="button"
                    aria-label="Edit category"
                    disabled={busy === c.id}
                    onClick={() => openEdit(c)}
                    className={iconBtn}
                  >
                    <PencilSimple size={16} weight="light" />
                  </button>
                  <ConfirmButton
                    disabled={busy === c.id || n > 0}
                    title={n > 0 ? "Move or delete its projects first" : "Delete category"}
                    onConfirm={() => void remove(c)}
                    label="Delete category"
                  >
                    <Trash size={16} weight="light" />
                  </ConfirmButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
