"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowRight, Check, ChevronDown, Heart, HeartHandshake,
  LifeBuoy, LogOut, RotateCcw, ShieldCheck, Sparkles, Trash2, UserRound, X,
} from "lucide-react";
import { ActivityCard } from "@/components/ActivityCard";
import { AuthDialog } from "@/components/AuthDialog";
import {
  activities, getRecommendations, hasCrisisTag, moodOptions,
  type Activity, type CheckInAnswers, type MoodTag,
} from "@/lib/catalog";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SafetyAnswer = "yes" | "no" | "unsure" | null;
type SavedSession = { id: string; created_at: string; mood_tags: MoodTag[]; activity_ids: string[] };

const initialAnswers: CheckInAnswers = { energy: "low", minutes: 15, setting: "either", budget: "free", social: "either" };

export function MoodJourney() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [moodTags, setMoodTags] = useState<MoodTag[]>([]);
  const [answers, setAnswers] = useState<CheckInAnswers>(initialAnswers);
  const [note, setNote] = useState("");
  const [safetyAnswer, setSafetyAnswer] = useState<SafetyAnswer>(null);
  const [urgentSupportOnly, setUrgentSupportOnly] = useState(false);
  const [recommendations, setRecommendations] = useState<Activity[] | null>(null);
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedSession[]>([]);
  const [historyMessage, setHistoryMessage] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const crisisRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const hasCrisis = hasCrisisTag(moodTags);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (urgentSupportOnly) window.setTimeout(() => crisisRef.current?.focus(), 0);
  }, [urgentSupportOnly]);

  function toggleMood(tag: MoodTag) {
    if (!moodTags.includes(tag) && moodTags.length >= 8) {
      setFormMessage("Choose up to eight feelings. You can remove one to choose another.");
      return;
    }
    const nextTags = moodTags.includes(tag) ? moodTags.filter((item) => item !== tag) : [...moodTags, tag];
    setMoodTags(nextTags);
    if (!hasCrisisTag(nextTags)) {
      setSafetyAnswer(null);
      setUrgentSupportOnly(false);
    }
    setRecommendations(null);
    setSavedMessage("");
    setFormMessage("");
  }

  function changeAnswer<K extends keyof CheckInAnswers>(key: K, value: CheckInAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setRecommendations(null);
    setSavedMessage("");
  }

  async function generateSuggestions() {
    setFormMessage("");
    setRecommendationMessage("");
    setSavedMessage("");
    if (moodTags.length === 0) {
      setFormMessage("Choose at least one feeling so we can find a useful starting point.");
      return;
    }
    if (hasCrisis && safetyAnswer === null) {
      setFormMessage("Please answer the safety question first. You can also go straight to urgent support below.");
      crisisRef.current?.focus();
      return;
    }
    if (hasCrisis && (safetyAnswer === "yes" || safetyAnswer === "unsure")) {
      setUrgentSupportOnly(true);
      setRecommendations(null);
      setTimeout(() => crisisRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }

    setUrgentSupportOnly(false);
    if (hasCrisis) {
      const safeIdeas = getRecommendations(moodTags, answers);
      setRecommendations(safeIdeas);
      setRecommendationMessage("These are low-pressure grounding and connection ideas. If your safety changes, reach out to a person or helpline.");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return;
    }
    setLoadingRecommendations(true);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodTags, answers }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Suggestions are temporarily unavailable.");
      const data = await response.json() as { recommendations?: Activity[] };
      if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) throw new Error("No matches yet.");
      setRecommendations(data.recommendations);
      setRecommendationMessage("");
    } catch {
      const localSuggestions = getRecommendations(moodTags, answers);
      setRecommendations(localSuggestions.length ? localSuggestions : getRecommendations(["low"], initialAnswers));
      setRecommendationMessage("Our connection is taking a pause, so here are a few ideas already on this page.");
    } finally {
      setLoadingRecommendations(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }

  async function saveCheckIn() {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!recommendations?.length) return;
    setSaving(true);
    setSavedMessage("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodTags, activityIds: recommendations.map((activity) => activity.id) }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save this check-in.");
      setSavedMessage("Saved. You can find it in your check-in history.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Could not save this check-in right now.");
    } finally {
      setSaving(false);
    }
  }

  async function openHistory() {
    setShowHistory(true);
    setHistoryMessage("");
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/sessions", { cache: "no-store" });
      const data = await response.json() as { sessions?: SavedSession[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load history.");
      setHistory(data.sessions ?? []);
    } catch (error) {
      setHistoryMessage(error instanceof Error ? error.message : "Could not load history right now.");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function deleteSavedSession(id: string) {
    setDeletingSession(id);
    setHistoryMessage("");
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not delete this check-in.");
      setHistory((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setHistoryMessage(error instanceof Error ? error.message : "Could not delete this check-in right now.");
    } finally {
      setDeletingSession(null);
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account and all saved check-ins? This cannot be undone.")) return;
    setHistoryMessage("");
    const response = await fetch("/api/account", { method: "DELETE" });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      setHistoryMessage(data.error ?? "Could not delete this account.");
      return;
    }
    await supabase?.auth.signOut();
    setShowHistory(false);
    setUser(null);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setShowHistory(false);
  }

  function startAgain() {
    setMoodTags([]);
    setAnswers(initialAnswers);
    setNote("");
    setSafetyAnswer(null);
    setUrgentSupportOnly(false);
    setRecommendations(null);
    setRecommendationMessage("");
    setSavedMessage("");
    setFormMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="little-by-little home">
          <span className="brand-mark"><Heart size={17} fill="currentColor" aria-hidden="true" /></span>
          <span>little-by-little</span>
        </a>
        <nav className="header-actions" aria-label="Main navigation">
          <a className="how-link" href="#how-it-works">How it works</a>
          {user ? (
            <div className="account-actions">
              <button className="account-button" type="button" onClick={openHistory}><UserRound size={17} /> <span>My check-ins</span></button>
              <button className="icon-button signout-button" type="button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button>
            </div>
          ) : (
            <button className="signin-link" type="button" onClick={() => setShowAuth(true)}>Sign in <ArrowRight size={15} /></button>
          )}
          <a className="urgent-header" href="#urgent-support"><LifeBuoy size={16} /> <span>Need urgent support?</span></a>
        </nav>
      </header>

      <div className="page-shell" id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A softer place to land</p>
            <h1 id="hero-title">You don’t have to<br className="desktop-break" /> figure it all out.<br /><em>Just one next thing.</em></h1>
            <p className="hero-description">A small check-in. A few gentle ideas for right now. Take what feels possible and leave the rest.</p>
            <a className="hero-link" href="#check-in">Start with how you feel <ArrowDown size={15} aria-hidden="true" /></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-sun" />
            <div className="art-window"><span /><span /><span /><span /></div>
            <div className="art-plant art-plant-one"><i /><i /><i /><i /><b /></div>
            <div className="art-plant art-plant-two"><i /><i /><i /><b /></div>
            <div className="art-note"><Sparkles size={15} /> Small is still a step.</div>
            <div className="art-floor" />
          </div>
        </section>

        <section className="checkin-section" id="check-in" aria-labelledby="checkin-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR CHECK-IN <span className="heading-line" /></p>
              <h2 id="checkin-title">What’s here for you today?</h2>
              <p className="section-subtitle">There’s no right way to feel. Pick as many as you like.</p>
            </div>
            <span className="step-badge"><span>01</span> / 02</span>
          </div>

          <div className="mood-grid" role="group" aria-label="Choose the feelings that fit">
            {moodOptions.map(({ tag, label, icon }) => {
              const selected = moodTags.includes(tag);
              const crisisTag = tag === "suicidal thoughts" || tag === "might hurt myself";
              return (
                <button
                  className={`mood-chip${selected ? " selected" : ""}${crisisTag ? " mood-chip-crisis" : ""}`}
                  type="button"
                  key={tag}
                  aria-pressed={selected}
                  onClick={() => toggleMood(tag)}
                >
                  <span className="mood-icon" aria-hidden="true">{selected ? <Check size={15} /> : icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mood-limit-note">Choose up to 8 feelings. You can change these whenever you like.</p>

          {hasCrisis && (
            <section className={`safety-check${urgentSupportOnly ? " safety-priority" : ""}`} ref={crisisRef} tabIndex={-1} aria-labelledby="safety-question">
              <div className="safety-icon"><HeartHandshake size={20} aria-hidden="true" /></div>
              <div className="safety-copy">
                <p className="safety-overline">A direct, caring question</p>
                <h3 id="safety-question">Are you in immediate danger, or worried you might hurt yourself right now?</h3>
                <p>Your answer stays in this moment. It is not saved. If you may act on these thoughts, please reach a person who can help right now.</p>
                <div className="safety-options" role="group" aria-label="Answer the immediate safety question">
                  <button type="button" className={safetyAnswer === "yes" ? "chosen" : ""} aria-pressed={safetyAnswer === "yes"} onClick={() => { setSafetyAnswer("yes"); setUrgentSupportOnly(true); setRecommendations(null); }}>Yes</button>
                  <button type="button" className={safetyAnswer === "no" ? "chosen" : ""} aria-pressed={safetyAnswer === "no"} onClick={() => { setSafetyAnswer("no"); setUrgentSupportOnly(false); }}>No</button>
                  <button type="button" className={safetyAnswer === "unsure" ? "chosen" : ""} aria-pressed={safetyAnswer === "unsure"} onClick={() => { setSafetyAnswer("unsure"); setUrgentSupportOnly(true); setRecommendations(null); }}>I’m not sure</button>
                </div>
              </div>
            </section>
          )}

          {urgentSupportOnly && (
            <section className="urgent-priority-card" aria-labelledby="priority-title">
              <p className="eyebrow">PLEASE GET A PERSON WITH YOU</p>
              <h3 id="priority-title">You deserve support right now.</h3>
              <p>If you can, move near someone you trust and tell them you may not be safe alone. If you are in immediate danger, contact local emergency services or go to a nearby emergency department.</p>
              <a className="button button-primary urgent-directory" href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">Find a helpline in your country <ArrowRight size={16} /></a>
              <p className="quiet-note">This site cannot provide crisis care. A real person can stay with you and help you take the next step.</p>
            </section>
          )}

          <div className="preferences-heading">
            <div>
              <p className="eyebrow">MAKE IT FIT YOUR RIGHT NOW <span className="heading-line" /></p>
              <p className="preferences-intro">A few practical details help keep suggestions realistic.</p>
            </div>
            <span className="step-badge"><span>02</span> / 02</span>
          </div>

          <div className="preferences-grid">
            <PreferenceSelect label="How much energy do you have?" value={answers.energy} onChange={(value) => changeAnswer("energy", value as CheckInAnswers["energy"])} options={[["low", "Very little"], ["some", "A little"], ["high", "A fair amount"]]} />
            <PreferenceSelect label="How much time feels okay?" value={String(answers.minutes)} onChange={(value) => changeAnswer("minutes", Number(value) as CheckInAnswers["minutes"])} options={[["5", "About 5 minutes"], ["15", "About 15 minutes"], ["30", "About 30 minutes"], ["60", "An hour is okay"]]} />
            <PreferenceSelect label="Where are you right now?" value={answers.setting} onChange={(value) => changeAnswer("setting", value as CheckInAnswers["setting"])} options={[["indoors", "Indoors"], ["outdoors", "Outdoors"], ["either", "Either is okay"]]} />
            <PreferenceSelect label="Would you like company?" value={answers.social} onChange={(value) => changeAnswer("social", value as CheckInAnswers["social"])} options={[["alone", "I’d rather be on my own"], ["someone", "I’d like someone around"], ["either", "Either is okay"]]} />
          </div>
          <div className="budget-control">
            <div><span className="budget-title">Keep it free?</span><span className="budget-description">We’ll only suggest things that need no spending.</span></div>
            <button className={`switch${answers.budget === "free" ? " on" : ""}`} type="button" role="switch" aria-checked={answers.budget === "free"} aria-label="Keep suggestions free" onClick={() => changeAnswer("budget", answers.budget === "free" ? "any" : "free")}><span /></button>
          </div>

          <div className="note-wrap">
            <label className="note-label" htmlFor="feelings-note">Want to say a little more? <span>Optional</span></label>
            <textarea id="feelings-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={700} placeholder="You can write a few words for yourself here. Whatever feels okay to share…" aria-describedby="note-privacy" />
            <p id="note-privacy" className="privacy-note"><ShieldCheck size={14} aria-hidden="true" /> This stays in this tab only. It is not sent, analysed, or saved.</p>
          </div>

          {formMessage && <p className="form-message form-message-wide" role="alert">{formMessage}</p>}
          <div className="checkin-actions">
            <p><span className="privacy-sparkle"><Sparkles size={15} /></span> Gentle ideas, never a diagnosis.</p>
            <button className="button button-primary get-ideas" type="button" onClick={generateSuggestions} disabled={loadingRecommendations || urgentSupportOnly}>
              {loadingRecommendations ? "Finding a few ideas…" : "Find a few gentle ideas"} <ArrowRight size={17} />
            </button>
          </div>
          {urgentSupportOnly && <p className="paused-message">Suggestions are paused while you connect with human support. The urgent help link above is here for you.</p>}
        </section>

        {recommendations && (
          <section className="results-section" ref={resultsRef} tabIndex={-1} aria-labelledby="results-title">
            <div className="results-heading">
              <div>
                <p className="eyebrow"><span className="eyebrow-dot" /> A FEW OPTIONS, JUST FOR THIS MOMENT</p>
                <h2 id="results-title">Which one feels easiest?</h2>
                <p className="section-subtitle">You can try one, change it, or do none. It’s up to you.</p>
              </div>
              <button className="text-button restart-button" type="button" onClick={startAgain}><RotateCcw size={15} /> Start over</button>
            </div>
            {recommendationMessage && <p className="offline-message" role="status"><span className="offline-dot" /> {recommendationMessage}</p>}
            <div className="activities-grid">
              {recommendations.map((activity, index) => <ActivityCard key={activity.id} activity={activity} index={index} />)}
            </div>
            <div className="save-row">
              <div className="save-row-copy"><ShieldCheck size={17} /><span>Only save this if you want to come back to it.</span></div>
              <button className="button button-secondary" type="button" onClick={saveCheckIn} disabled={saving}>{saving ? "Saving…" : user ? "Save this check-in" : "Sign in to save"} <ArrowRight size={15} /></button>
            </div>
            {savedMessage && <p className="save-message" role="status">{savedMessage}</p>}
          </section>
        )}

        <section className="how-section" id="how-it-works" aria-labelledby="how-title">
          <div className="how-intro"><p className="eyebrow">A LITTLE ABOUT THIS SPACE</p><h2 id="how-title">Made for a small next step.</h2></div>
          <div className="how-grid">
            <article><span className="how-number">01</span><h3>Start where you are</h3><p>Choose the feelings and practical limits that fit right now. You can skip the optional note.</p></article>
            <article><span className="how-number">02</span><h3>Find one doable thing</h3><p>Suggestions come from a small, reviewed activity list and your choices. They are not a diagnosis.</p></article>
            <article><span className="how-number">03</span><h3>Keep it private</h3><p>Use the site without an account. Sign in only if you want to save selected moods and activities.</p></article>
          </div>
          <p className="not-care-copy">This site is for gentle everyday ideas, not therapy or emergency care. Your feelings matter whether or not an activity helps.</p>
        </section>

        <section className="urgent-footer" id="urgent-support" aria-labelledby="urgent-title">
          <div className="urgent-footer-icon"><LifeBuoy size={22} aria-hidden="true" /></div>
          <div className="urgent-footer-copy"><p className="eyebrow">HUMAN HELP IS HERE</p><h2 id="urgent-title">If you might be in danger, please reach out now.</h2><p>Contact your local emergency services or go to a nearby emergency department. For support in your country, use the verified directory below.</p></div>
          <a className="button button-light" href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">Find a helpline <ArrowRight size={16} /></a>
        </section>
        <p className="directory-caption">Find A Helpline lists verified support services in 175+ countries. <a href="https://findahelpline.com/verification" target="_blank" rel="noopener noreferrer">About their verification <ChevronDown size={13} /></a></p>
      </div>

      <footer className="site-footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><Heart size={15} fill="currentColor" /></span><span>little-by-little</span></a><p>Be gentle with yourself today.</p><span className="footer-status"><span /> For adults · English · Available worldwide</span></footer>

      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
      {showHistory && (
        <HistoryDialog
          history={history}
          message={historyMessage}
          loading={loadingHistory}
          deletingId={deletingSession}
          onClose={() => setShowHistory(false)}
          onDelete={deleteSavedSession}
          onDeleteAccount={deleteAccount}
        />
      )}
    </main>
  );
}

function PreferenceSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <label className="preference-field">
      <span>{label}</span>
      <span className="select-shell"><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></span>
    </label>
  );
}

function HistoryDialog({
  history, message, loading, deletingId, onClose, onDelete, onDeleteAccount,
}: {
  history: SavedSession[];
  message: string;
  loading: boolean;
  deletingId: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDeleteAccount: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Close history"><X size={19} /></button>
        <p className="eyebrow">SAVED BY YOU</p>
        <h2 id="history-title">Your check-in history</h2>
        <p className="dialog-intro">Only the mood tags and activities you chose to save are here.</p>
        {loading ? <p className="history-empty">Loading your check-ins…</p> : history.length === 0 ? <p className="history-empty">No saved check-ins yet. You can save one after finding activities.</p> : (
          <div className="history-list">
            {history.map((session) => (
              <article className="history-item" key={session.id}>
                <div className="history-date">{new Date(session.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
                <div className="history-tags">{session.mood_tags.map((tag) => <span key={tag}>{moodOptions.find((option) => option.tag === tag)?.label ?? tag}</span>)}</div>
                <p className="history-activities">{session.activity_ids.map((id) => activities.find((activity) => activity.id === id)?.title ?? "Activity").join(" · ")}</p>
                <button className="history-delete" type="button" disabled={deletingId === session.id} onClick={() => onDelete(session.id)}><Trash2 size={14} /> {deletingId === session.id ? "Deleting…" : "Delete"}</button>
              </article>
            ))}
          </div>
        )}
        {message && <p className="form-message" role="status">{message}</p>}
        <div className="history-bottom"><button className="button button-secondary" type="button" onClick={onClose}>Done</button><button className="danger-button" type="button" onClick={onDeleteAccount}>Delete account</button></div>
      </section>
    </div>
  );
}
