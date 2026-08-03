import { useMemo, useState } from "react";

const asset = (name) => `http://127.0.0.1:3000/placeholders/${name}.png`;

const STEPS = [
  { id: "pets", label: "Pets", kicker: "Step 1", title: "Who needs visits?", description: "Tell us a little about the pets who will be cared for at home." },
  { id: "dates", label: "Dates & visits", kicker: "Step 2", title: "When should visits happen?", description: "Choose the care dates, how often visits happen, and preferred times." },
  { id: "tasks", label: "Care plan", kicker: "Step 3", title: "What should happen during each visit?", description: "Choose the essentials first. You can add a note for anything personal to your routine." },
  { id: "area", label: "Area", kicker: "Step 4", title: "Where is care needed?", description: "Set the approximate area so we can recommend sitters who can reach you." },
  { id: "budget", label: "Budget", kicker: "Step 5", title: "What budget feels right?", description: "A clear budget helps the right sitters decide whether this request fits." },
  { id: "preview", label: "Preview", kicker: "Step 6", title: "Ready to review your request?", description: "Here is how your home visit request will look to sitters." },
];

const TASKS = [
  { id: "food", label: "Refresh food & water", hint: "Meals, fresh water, and feeding notes" },
  { id: "litter", label: "Clean litter box", hint: "Scoop, tidy, and leave the area fresh" },
  { id: "walk", label: "Short walk or playtime", hint: "Movement and gentle companionship" },
  { id: "meds", label: "Medication", hint: "Add instructions in the note below" },
];

const initialState = {
  pets: [
    { id: "momo", name: "Momo", type: "Cat", detail: "Domestic shorthair · 4 years", image: asset("cat") },
    { id: "buddy", name: "Buddy", type: "Dog", detail: "Golden retriever · 6 years", image: asset("dog") },
  ],
  dates: { start: "2026-08-08", end: "2026-08-11" },
  frequency: "Every day",
  visitsPerDay: 2,
  visitTimes: ["Morning", "Evening"],
  tasks: ["food", "litter", "walk"],
  taskNote: "The key is inside the small lockbox by the entrance.",
  area: "Shibuya, Tokyo",
  distance: "Within 5 km",
  budgetMode: "range",
  budgetMin: "2,500",
  budgetMax: "3,500",
  travel: "Included in visit fee",
};

function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visitedIndex, setVisitedIndex] = useState(0);
  const [form, setForm] = useState(initialState);
  const [notice, setNotice] = useState("");

  const active = STEPS[activeIndex];
  const completedCount = Math.max(0, Math.min(activeIndex, STEPS.length - 1));

  const update = (patch) => setForm((current) => ({ ...current, ...patch }));
  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };
  const goTo = (index) => {
    setActiveIndex(index);
    setVisitedIndex((current) => Math.max(current, index));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    if (activeIndex === STEPS.length - 1) {
      showNotice("Prototype only — nothing was submitted.");
      return;
    }
    goTo(activeIndex + 1);
  };
  const back = () => {
    if (activeIndex > 0) goTo(activeIndex - 1);
  };

  const summary = useMemo(() => ({
    visits: `${form.visitsPerDay} visits / day`,
    dates: `${formatDate(form.dates.start)} – ${formatDate(form.dates.end)}`,
    total: form.budgetMode === "open" ? "Open to offers" : `¥${form.budgetMin || "0"}–¥${form.budgetMax || "0"}`,
  }), [form]);

  return (
    <div className="prototype-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <img src="http://127.0.0.1:3000/favicon.svg" alt="" />
          <span>PetNido</span>
        </div>
        <div className="topbar-actions">
          <span className="saved-status"><span className="status-dot" /> Saved just now</span>
          <button className="quiet-button" onClick={() => showNotice("Your draft is saved.")}>Save &amp; exit</button>
        </div>
      </header>

      <div className="flow-layout">
        <aside className="progress-rail" aria-label="Home visits progress">
          <div className="rail-intro">
            <span className="eyebrow">Home visits</span>
            <span className="rail-count">{String(activeIndex + 1).padStart(2, "0")} / 06</span>
          </div>
          <p className="rail-helper">Your sitter visits your home, so routines stay familiar for everyone.</p>
          <nav className="step-list">
            {STEPS.map((step, index) => {
              const state = index === activeIndex ? "current" : index <= visitedIndex ? "complete" : "upcoming";
              return (
                <button key={step.id} className={`step-item ${state}`} onClick={() => goTo(index)} aria-current={index === activeIndex ? "step" : undefined}>
                  <span className="step-marker">{index < activeIndex ? "✓" : String(index + 1)}</span>
                  <span className="step-copy">
                    <span className="step-label">{step.label}</span>
                    {index === activeIndex && <span className="step-state">In progress</span>}
                    {index < activeIndex && <span className="step-state">Complete</span>}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="rail-tip">
            <span className="tip-mark">?</span>
            <div><strong>Take your time</strong><p>You can save and come back whenever you like.</p></div>
          </div>
        </aside>

        <main className="main-column">
          <div className="mobile-progress"><span style={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }} /></div>
          <section className="step-heading">
            <div>
              <span className="eyebrow">{active.kicker} · Home visits</span>
              <h1>{active.title}</h1>
              <p>{active.description}</p>
            </div>
            <span className="mode-chip">Home visits selected</span>
          </section>

          <section className="step-content">
            {active.id === "pets" && <PetsStep form={form} update={update} />}
            {active.id === "dates" && <DatesStep form={form} update={update} />}
            {active.id === "tasks" && <TasksStep form={form} update={update} />}
            {active.id === "area" && <AreaStep form={form} update={update} />}
            {active.id === "budget" && <BudgetStep form={form} update={update} />}
            {active.id === "preview" && <PreviewStep form={form} summary={summary} onEdit={goTo} />}
          </section>

          <footer className="action-bar">
            <button className="secondary-button" onClick={back} disabled={activeIndex === 0}>Back</button>
            <div className="action-hint">{activeIndex === STEPS.length - 1 ? "Nothing is submitted in this design prototype." : "You can change any answer later."}</div>
            <button className="primary-button" onClick={next}>{activeIndex === STEPS.length - 1 ? "Publish request" : `Continue to ${STEPS[activeIndex + 1].label.toLowerCase()}`}</button>
          </footer>
        </main>

        <SummaryPanel form={form} summary={summary} activeId={active.id} />
      </div>

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}

function PetsStep({ form, update }) {
  const addPet = () => update({ pets: [...form.pets, { id: `pet-${form.pets.length + 1}`, name: "New pet", type: "Pet", detail: "Add details later", image: asset("other") }] });
  const removePet = (id) => update({ pets: form.pets.filter((pet) => pet.id !== id) });
  return <div className="content-stack">
    <div className="callout"><span className="callout-mark">01</span><p>Add each pet once. The sitter will see these details before deciding whether the request is a good fit.</p></div>
    <div className="pet-list">
      {form.pets.map((pet, index) => <div className="pet-row" key={pet.id}>
        <img src={pet.image} alt="" className="pet-avatar" />
        <div className="pet-info"><span className="pet-number">Pet {index + 1}</span><input aria-label={`Pet ${index + 1} name`} value={pet.name} onChange={(event) => update({ pets: form.pets.map((item) => item.id === pet.id ? { ...item, name: event.target.value } : item) })} /><p>{pet.type} · {pet.detail}</p></div>
        <button className="text-button" onClick={() => removePet(pet.id)} disabled={form.pets.length === 1}>Remove</button>
      </div>)}
    </div>
    <button className="add-row-button" onClick={addPet}>+ Add another pet</button>
  </div>;
}

function DatesStep({ form, update }) {
  const changeDate = (key, value) => update({ dates: { ...form.dates, [key]: value } });
  const changeVisitTime = (index, value) => update({ visitTimes: form.visitTimes.map((time, timeIndex) => timeIndex === index ? value : time) });
  return <div className="content-stack">
    <div className="field-grid two-columns">
      <label className="field"><span>Start date</span><input type="date" value={form.dates.start} onChange={(event) => changeDate("start", event.target.value)} /></label>
      <label className="field"><span>End date</span><input type="date" value={form.dates.end} onChange={(event) => changeDate("end", event.target.value)} /></label>
    </div>
    <div className="field-section"><span className="field-label">How often should visits happen?</span><div className="choice-row">{["Every day", "Every 2 days", "Custom"].map((option) => <button key={option} className={`choice-pill ${form.frequency === option ? "selected" : ""}`} onClick={() => update({ frequency: option })}>{option}</button>)}</div></div>
    <div className="field-section"><span className="field-label">Visits on each care day</span><div className="choice-row">{[1, 2, 3].map((count) => <button key={count} className={`count-pill ${form.visitsPerDay === count ? "selected" : ""}`} onClick={() => update({ visitsPerDay: count, visitTimes: Array.from({ length: count }, (_, index) => form.visitTimes[index] || "Flexible") })}>{count}</button>)}</div></div>
    <div className="time-grid">{Array.from({ length: form.visitsPerDay }, (_, index) => <label className="field" key={index}><span>{form.visitsPerDay === 1 ? "Preferred time" : `Visit ${index + 1}`}</span><select value={form.visitTimes[index] || "Flexible"} onChange={(event) => changeVisitTime(index, event.target.value)}><option>Morning</option><option>Midday</option><option>Evening</option><option>Flexible</option></select></label>)}</div>
    <p className="helper-text">Sitters will see the time preference, not your exact address, until you choose to match.</p>
  </div>;
}

function TasksStep({ form, update }) {
  const toggleTask = (id) => update({ tasks: form.tasks.includes(id) ? form.tasks.filter((task) => task !== id) : [...form.tasks, id] });
  return <div className="content-stack">
    <div className="task-list">{TASKS.map((task) => <button key={task.id} className={`task-row ${form.tasks.includes(task.id) ? "selected" : ""}`} onClick={() => toggleTask(task.id)}><span className="task-check">{form.tasks.includes(task.id) ? "✓" : ""}</span><span><strong>{task.label}</strong><small>{task.hint}</small></span><span className="task-state">{form.tasks.includes(task.id) ? "Included" : "Add"}</span></button>)}</div>
    <label className="field"><span>Anything the sitter should know?</span><textarea value={form.taskNote} onChange={(event) => update({ taskNote: event.target.value })} rows="4" placeholder="Add a note about routines, access, or personality..." /></label>
    <div className="inline-note"><span className="tip-mark">i</span><p>Keep this practical: entry instructions and personal routines are useful here. You can discuss sensitive details privately after matching.</p></div>
  </div>;
}

function AreaStep({ form, update }) {
  return <div className="content-stack">
    <label className="field"><span>Search your neighbourhood or a station</span><div className="search-row"><input value={form.area} onChange={(event) => update({ area: event.target.value })} /><button className="secondary-button small" onClick={() => update({ area: form.area || "Shibuya, Tokyo" })}>Confirm area</button></div></label>
    <div className="location-panel"><div className="map-surface"><span className="map-label">Approximate matching area</span><span className="map-pin">●</span><span className="map-road road-one" /><span className="map-road road-two" /><span className="map-road road-three" /><span className="map-caption">{form.area || "Choose an area"}</span></div><div className="location-copy"><span className="eyebrow">Shared after matching</span><h3>Your exact address stays private</h3><p>We use an approximate point to help sitters judge travel time. Share building and entry details only after you choose someone.</p></div></div>
    <div className="field-section"><span className="field-label">How far should we look?</span><div className="choice-row">{["Within 3 km", "Within 5 km", "Within 10 km"].map((option) => <button key={option} className={`choice-pill ${form.distance === option ? "selected" : ""}`} onClick={() => update({ distance: option })}>{option}</button>)}</div></div>
  </div>;
}

function BudgetStep({ form, update }) {
  return <div className="content-stack">
    <div className="budget-options">{[["exact", "Set an exact amount", "¥3,000 per visit"], ["range", "Give a comfortable range", "¥2,500 – ¥3,500 per visit"], ["open", "Let sitters suggest", "Open to offers"]].map(([id, label, detail]) => <button key={id} className={`budget-option ${form.budgetMode === id ? "selected" : ""}`} onClick={() => update({ budgetMode: id })}><span className="radio-mark" /><span><strong>{label}</strong><small>{detail}</small></span></button>)}</div>
    {form.budgetMode !== "open" && <div className="field-grid two-columns"><label className="field"><span>{form.budgetMode === "range" ? "From per visit" : "Per visit"}</span><div className="currency-input"><span>¥</span><input value={form.budgetMin} onChange={(event) => update({ budgetMin: event.target.value })} /></div></label>{form.budgetMode === "range" && <label className="field"><span>Up to per visit</span><div className="currency-input"><span>¥</span><input value={form.budgetMax} onChange={(event) => update({ budgetMax: event.target.value })} /></div></label>}</div>}
    <div className="field-section"><span className="field-label">Travel costs</span><div className="choice-row">{["Included in visit fee", "Discuss with sitter"].map((option) => <button key={option} className={`choice-pill ${form.travel === option ? "selected" : ""}`} onClick={() => update({ travel: option })}>{option}</button>)}</div></div>
    <div className="callout soft"><span className="callout-mark">¥</span><p>A transparent budget helps sitters make a confident decision and keeps conversations focused on your pets.</p></div>
  </div>;
}

function PreviewStep({ form, summary, onEdit }) {
  return <div className="preview-layout">
    <div className="preview-main">
      <span className="public-status">Open to offers</span>
      <h2>Gentle home visits for {form.pets.map((pet) => pet.name).join(" & ")}</h2>
      <p className="preview-lede">I need a sitter to visit my home {form.visitsPerDay === 1 ? "once" : `${form.visitsPerDay} times`} a day between {summary.dates}. Please follow the care plan below and let me know if you have relevant experience.</p>
      <div className="preview-section"><div className="preview-section-heading"><h3>Pets needing care</h3><button onClick={() => onEdit(0)}>Edit</button></div>{form.pets.map((pet) => <div className="preview-pet" key={pet.id}><img src={pet.image} alt="" className="pet-avatar" /><div><strong>{pet.name}</strong><span>{pet.type} · {pet.detail}</span></div></div>)}</div>
      <div className="preview-section"><div className="preview-section-heading"><h3>Care schedule</h3><button onClick={() => onEdit(1)}>Edit</button></div><div className="summary-line"><span>{form.frequency}</span><span>·</span><span>{summary.visits}</span><span>·</span><span>{summary.dates}</span></div>{form.visitTimes.map((time, index) => <div className="visit-row" key={`${time}-${index}`}><strong>Visit {index + 1}</strong><span>{time}</span><span>{form.tasks.length} tasks</span></div>)}</div>
      <div className="preview-section"><div className="preview-section-heading"><h3>What the sitter will do</h3><button onClick={() => onEdit(2)}>Edit</button></div><div className="tag-wrap">{form.tasks.map((taskId) => <span className="preview-tag" key={taskId}>{TASKS.find((task) => task.id === taskId)?.label}</span>)}</div><p className="preview-note">{form.taskNote}</p></div>
    </div>
    <aside className="publish-panel"><span className="eyebrow">Your request</span><strong className="estimate">{summary.total}</strong><span className="estimate-label">estimated per visit</span><div className="publish-line"><span>Area</span><strong>{form.area}</strong></div><div className="publish-line"><span>Travel</span><strong>{form.travel === "Included in visit fee" ? "Included" : "Discuss"}</strong></div><button className="primary-button full" onClick={() => window.alert("Prototype only — nothing was submitted.")}>Publish request</button><p>After publishing, sitters can review the request and contact you.</p></aside>
  </div>;
}

function SummaryPanel({ form, summary, activeId }) {
  return <aside className="summary-panel"><div className="summary-header"><div><span className="eyebrow">Request snapshot</span><h2>Home visits</h2></div><span className="summary-progress">{Math.min(6, 1 + (activeId === "preview" ? 5 : STEPS.findIndex((step) => step.id === activeId)))} / 06</span></div><div className="summary-progress-bar"><span style={{ width: `${((STEPS.findIndex((step) => step.id === activeId) + 1) / STEPS.length) * 100}%` }} /></div><div className="summary-block"><span className="summary-label">Pets</span>{form.pets.map((pet) => <div className="summary-pet" key={pet.id}><img src={pet.image} alt="" /><span><strong>{pet.name}</strong><small>{pet.type}</small></span></div>)}</div><div className="summary-block"><span className="summary-label">Care dates</span><strong>{summary.dates}</strong><small>{summary.visits}</small></div><div className="summary-block"><span className="summary-label">Matching area</span><strong>{form.area || "Not set yet"}</strong><small>{form.distance}</small></div><div className="summary-block summary-bottom"><span className="summary-label">Estimated budget</span><strong className="summary-total">{summary.total}</strong><small>{form.travel === "Included in visit fee" ? "Travel included" : "Travel to discuss"}</small></div></aside>;
}

function formatDate(value) {
  if (!value) return "Choose a date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export { App };
