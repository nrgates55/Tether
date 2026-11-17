import { useEffect, useState, type FormEvent } from "react";
import type { CreatePersonInput, Person, PreferenceType } from "../models/Person";
import {
  addPreference,
  createPerson,
  deletePerson,
  getAllPeople,
  getPerson,
  removePreference,
  searchPeople,
  updatePerson,
} from "../services/peopleService";
import "./PeoplePage.css";

type View = "list" | "details" | "create" | "edit";

type PersonFields = {
  name: string;
  email: string;
  phone: string;
  heightCm: string;
  weightKg: string;
  description: string;
  notes: string;
  rating: string;
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function toFields(person?: Person | null): PersonFields {
  return {
    name: person?.name ?? "",
    email: person?.email ?? "",
    phone: person?.phone ?? "",
    heightCm: person?.heightCm == null ? "" : String(person.heightCm),
    weightKg: person?.weightKg == null ? "" : String(person.weightKg),
    description: person?.description ?? "",
    notes: person?.notes ?? "",
    rating: person?.rating == null ? "" : String(person.rating),
  };
}

function toOptionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function PersonForm({
  person,
  busy,
  onCancel,
  onSave,
}: {
  person?: Person | null;
  busy: boolean;
  onCancel: () => void;
  onSave: (input: CreatePersonInput) => Promise<void>;
}) {
  const [fields, setFields] = useState<PersonFields>(() => toFields(person));
  const editing = Boolean(person);

  function setField(field: keyof PersonFields, value: string) {
    setFields((previous) => ({ ...previous, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave({
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      heightCm: toOptionalNumber(fields.heightCm),
      weightKg: toOptionalNumber(fields.weightKg),
      description: fields.description,
      notes: fields.notes,
      rating: toOptionalNumber(fields.rating),
    });
  }

  return (
    <section className="screen">
      <button type="button" className="text-back" onClick={onCancel}>← Back</button>
      <p className="eyebrow">PEOPLE / {editing ? "EDIT PROFILE" : "NEW PROFILE"}</p>
      <h1 className="page-title">{editing ? "Edit profile" : "Add someone new"}</h1>
      <p className="muted page-intro">Only the name is required. You can fill in the rest later.</p>

      <form className="profile-form" onSubmit={submit}>
        <div className="form-section">
          <h2>Basic details</h2>
          <label className="field">
            <span>Name <span aria-hidden="true">*</span></span>
            <input autoFocus required maxLength={100} autoComplete="off" value={fields.name} onChange={(event) => setField("name", event.target.value)} placeholder="Their name" />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea rows={3} value={fields.description} onChange={(event) => setField("description", event.target.value)} placeholder="A few words about them..." />
          </label>
          <label className="field">
            <span>Private notes</span>
            <textarea rows={4} value={fields.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Anything you'd like to remember..." />
          </label>
        </div>

        <div className="form-section">
          <h2>Contact information</h2>
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="off" value={fields.email} onChange={(event) => setField("email", event.target.value)} placeholder="name@example.com" />
          </label>
          <label className="field">
            <span>Phone</span>
            <input type="tel" autoComplete="off" value={fields.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="Optional" />
          </label>
        </div>

        <div className="form-section">
          <h2>Additional details</h2>
          <div className="two-column-fields">
            <label className="field">
              <span>Height (cm)</span>
              <input type="number" min="0.1" step="any" inputMode="decimal" value={fields.heightCm} onChange={(event) => setField("heightCm", event.target.value)} placeholder="170" />
            </label>
            <label className="field">
              <span>Weight (kg)</span>
              <input type="number" min="0.1" step="any" inputMode="decimal" value={fields.weightKg} onChange={(event) => setField("weightKg", event.target.value)} placeholder="65" />
            </label>
          </div>
          <label className="field">
            <span>Rating (1–5)</span>
            <select value={fields.rating} onChange={(event) => setField("rating", event.target.value)}>
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score} / 5</option>)}
            </select>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="button button-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Create profile"}</button>
        </div>
      </form>
    </section>
  );
}

export default function PeoplePage() {
  const [view, setView] = useState<View>("list");
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preferenceLabel, setPreferenceLabel] = useState("");
  const [preferenceType, setPreferenceType] = useState<PreferenceType>("like");

  useEffect(() => {
    let active = true;

    const request = query.trim() ? searchPeople(query) : getAllPeople();
    request
      .then((results) => {
        if (!active) return;
        setPeople([...results].sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(errorMessage(cause));
        setLoading(false);
      });

    return () => { active = false; };
  }, [query, reload]);

  function refreshPeople() {
    setReload((value) => value + 1);
  }

  function openDetails(person: Person) {
    setSelected(person);
    setError("");
    setView("details");
  }

  function goToList() {
    setView("list");
    setError("");
  }

  async function savePerson(input: CreatePersonInput) {
    setBusy(true);
    setError("");
    try {
      const saved = view === "edit" && selected
        ? await updatePerson(selected.id, input)
        : await createPerson(input);
      setSelected(saved);
      setView("details");
      refreshPeople();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function refreshSelected(id: string) {
    const latest = await getPerson(id);
    if (latest) setSelected(latest);
    refreshPeople();
  }

  async function savePreference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await addPreference(selected.id, preferenceLabel, preferenceType);
      await refreshSelected(selected.id);
      setPreferenceLabel("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function deletePreference(preferenceId: string) {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await removePreference(selected.id, preferenceId);
      await refreshSelected(selected.id);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function removePerson() {
    if (!selected || busy) return;
    if (!window.confirm(`Permanently delete ${selected.name}? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      await deletePerson(selected.id);
      setSelected(null);
      setView("list");
      refreshPeople();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setError("")}>×</button>
        </div>
      )}

      {view === "list" && (
        <section className="screen">
          <p className="eyebrow">YOUR DIRECTORY</p>
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">People<span className="accent-dot">.</span></h1>
              <p className="muted">Keep the details that matter close.</p>
            </div>
            <button type="button" className="add-button" onClick={() => { setError(""); setView("create"); }}>+ Add</button>
          </div>

          <label className="search-box">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <span className="sr-only">Search people</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people..." />
          </label>

          <div className="list-label">
            <span>{query ? "SEARCH RESULTS" : "SAVED PROFILES"}</span>
            <span>{people.length} {people.length === 1 ? "person" : "people"}</span>
          </div>

          {loading && people.length === 0 ? (
            <p className="muted list-message">Loading profiles...</p>
          ) : people.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">♡</span>
              <h2>{query ? "No matches found" : "Your space starts here"}</h2>
              <p>{query ? "Try a different name." : "Add your first person to start building your directory."}</p>
              {!query && <button type="button" className="button button-primary" onClick={() => setView("create")}>Add your first person</button>}
            </div>
          ) : (
            <div className="people-list">
              {people.map((person) => (
                <button key={person.id} type="button" className="person-card" onClick={() => openDetails(person)}>
                  <span className="avatar" aria-hidden="true">{initials(person.name)}</span>
                  <span className="person-card-info">
                    <strong>{person.name}</strong>
                    <span>{person.description || person.notes || `${person.preferences?.length ?? 0} saved preferences`}</span>
                  </span>
                  <span className="person-card-end">
                    {person.rating != null && <span className="small-rating">★ {person.rating}</span>}
                    <span className="chevron" aria-hidden="true">›</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {(view === "create" || view === "edit") && (
        <PersonForm
          key={view === "edit" ? `edit-${selected?.id}` : "create"}
          person={view === "edit" ? selected : null}
          busy={busy}
          onCancel={() => { setError(""); setView(view === "edit" ? "details" : "list"); }}
          onSave={savePerson}
        />
      )}

      {view === "details" && selected && (
        <section className="screen">
          <button type="button" className="text-back" onClick={goToList}>← All people</button>
          <div className="detail-top">
            <span className="avatar avatar-large" aria-hidden="true">{initials(selected.name)}</span>
            <div className="detail-info">
              <p className="eyebrow">PROFILE</p>
              <h1 className="page-title">{selected.name}</h1>
              {selected.rating != null && <span className="rating-pill">★ {selected.rating} / 5</span>}
            </div>
          </div>

          <button type="button" className="button button-primary full-width" onClick={() => { setError(""); setView("edit"); }}>Edit profile</button>

          <div className="detail-panel">
            <h2>About</h2>
            {selected.description ? <p className="detail-paragraph">{selected.description}</p> : <p className="muted">No description yet.</p>}
            <div className="detail-data-grid">
              {selected.email && <div><span>Email</span><strong>{selected.email}</strong></div>}
              {selected.phone && <div><span>Phone</span><strong>{selected.phone}</strong></div>}
              {selected.heightCm != null && <div><span>Height</span><strong>{selected.heightCm} cm</strong></div>}
              {selected.weightKg != null && <div><span>Weight</span><strong>{selected.weightKg} kg</strong></div>}
            </div>
          </div>

          <div className="detail-panel">
            <h2>Private notes</h2>
            <p className={selected.notes ? "detail-paragraph" : "muted"}>{selected.notes || "No notes yet. Use Edit profile to add some."}</p>
          </div>

          <div className="detail-panel">
            <h2>Preferences <span className="muted-count">{selected.preferences?.length ?? 0}</span></h2>
            {selected.preferences && selected.preferences.length > 0 ? (
              <div className="preference-list">
                {selected.preferences.map((preference) => (
                  <div key={preference.id} className={`preference-chip ${preference.type}`}>
                    <span>{preference.type === "like" ? "+" : preference.type === "dislike" ? "−" : "•"} {preference.label}</span>
                    <button type="button" disabled={busy} aria-label={`Remove ${preference.label}`} onClick={() => void deletePreference(preference.id)}>×</button>
                  </div>
                ))}
              </div>
            ) : <p className="muted">Nothing saved yet.</p>}

            <form className="add-preference-form" onSubmit={(event) => void savePreference(event)}>
              <label className="field">
                <span>Add a preference</span>
                <input value={preferenceLabel} maxLength={100} onChange={(event) => setPreferenceLabel(event.target.value)} placeholder="e.g. Hiking, sushi, pets..." required />
              </label>
              <div className="preference-controls">
                <label className="sr-only" htmlFor="preference-type">Preference type</label>
                <select id="preference-type" value={preferenceType} onChange={(event) => setPreferenceType(event.target.value as PreferenceType)}>
                  <option value="like">Likes</option>
                  <option value="dislike">Dislikes</option>
                  <option value="neutral">Neutral</option>
                </select>
                <button type="submit" className="button button-secondary" disabled={busy || !preferenceLabel.trim()}>+ Add preference</button>
              </div>
            </form>
          </div>

          <p className="profile-created">Added {new Date(selected.createdAt).toLocaleDateString()}</p>
          <button type="button" className="delete-button" disabled={busy} onClick={() => void removePerson()}>Delete profile</button>
        </section>
      )}
    </div>
  );
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Something went wrong. Please try again.";
}
