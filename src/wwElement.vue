<template>
  <div class="hrk-root abo-root">
    <main class="abo-page hrk-page">

      <!-- Header -->
      <div class="abo-header">
        <h1 class="hrk-h1">Wähle dein Imploya-Abo</h1>
        <p class="hrk-muted">30 Tage kostenlos testen — keine Kreditkarte, jederzeit kündbar.</p>

        <!-- Billing Toggle -->
        <div class="abo-toggle">
          <button
            class="abo-toggle__btn"
            :class="{ 'abo-toggle__btn--active': billing === 'month' }"
            @click="billing = 'month'"
          >Monatlich</button>
          <button
            class="abo-toggle__btn"
            :class="{ 'abo-toggle__btn--active': billing === 'year' }"
            @click="billing = 'year'"
          >Jährlich <span class="abo-toggle__save">2 Monate gratis</span></button>
        </div>
      </div>

      <!-- Plan-Karten -->
      <div class="abo-cards">

        <!-- BASIS -->
        <div class="hrk-card abo-card" :class="{ 'abo-card--selected': selected === 'basis' }" @click="selectPlan('basis')">
          <div class="abo-card__badge" style="visibility:hidden">—</div>
          <h2 class="abo-card__name">Basis</h2>
          <div class="abo-card__price">
            <span class="abo-card__amount">CHF {{ billing === 'year' ? '290' : '29' }}</span>
            <span class="abo-card__period">{{ billing === 'year' ? '/Jahr' : '/Monat' }}</span>
          </div>
          <p v-if="billing === 'year'" class="abo-card__saving">statt CHF 348/Jahr — 2 Monate gratis</p>
          <p class="abo-card__tagline">Ideal für Betriebe mit wenigen Mitarbeitenden.</p>
          <ul class="abo-card__features">
            <li>✓ Emily — 20 Fragen/Woche</li>
            <li>✓ 5 Dokumente/Monat</li>
            <li>✓ Vertrag, Kündigung, Krankmeldung</li>
            <li>✓ Zeugnis, Verwarnung, Stelleninserat</li>
            <li>✓ Personaldossier & Dokumente-Upload</li>
            <li class="abo-card__feat--dim">— Offboarding-Paket</li>
            <li class="abo-card__feat--dim">— Saison-Kit</li>
            <li class="abo-card__feat--dim">— Onboarding-Checkliste</li>
          </ul>
          <button
            class="hrk-btn hrk-btn--secondary abo-card__cta"
            :disabled="busy"
            @click.stop="startCheckout('basis')"
          >{{ busy && selected === 'basis' ? 'Einen Moment …' : 'Basis starten' }}</button>
        </div>

        <!-- PLUS -->
        <div class="hrk-card abo-card abo-card--highlight" :class="{ 'abo-card--selected': selected === 'plus' }" @click="selectPlan('plus')">
          <div class="abo-card__badge">Empfohlen</div>
          <h2 class="abo-card__name">Plus</h2>
          <div class="abo-card__price">
            <span class="abo-card__amount">CHF {{ billing === 'year' ? '590' : '59' }}</span>
            <span class="abo-card__period">{{ billing === 'year' ? '/Jahr' : '/Monat' }}</span>
          </div>
          <p v-if="billing === 'year'" class="abo-card__saving">statt CHF 708/Jahr — 2 Monate gratis</p>
          <p class="abo-card__tagline">Für wachsende Betriebe mit häufigeren HR-Fragen.</p>
          <ul class="abo-card__features">
            <li>✓ Emily — 30 Fragen/Woche</li>
            <li>✓ 25 Dokumente/Monat</li>
            <li>✓ Vertrag, Kündigung, Krankmeldung</li>
            <li>✓ Zeugnis, Verwarnung, Stelleninserat</li>
            <li>✓ Personaldossier & Dokumente-Upload</li>
            <li>✓ Offboarding-Paket</li>
            <li>✓ Saison-Kit</li>
            <li>✓ Onboarding-Checkliste & Vorlagen</li>
          </ul>
          <button
            class="hrk-btn hrk-btn--primary abo-card__cta"
            :disabled="busy"
            @click.stop="startCheckout('plus')"
          >{{ busy && selected === 'plus' ? 'Einen Moment …' : 'Plus starten' }}</button>
        </div>

      </div>

      <!-- Fehler -->
      <p v-if="errorMsg" class="abo-error" role="alert">{{ errorMsg }}</p>

      <!-- Hinweis Einzelpreise -->
      <p class="abo-hint-extra">Zusätzliche Dokumente CHF 3/Stück · Extra Emily-Fragen CHF 9/10 Fragen</p>

      <!-- Später entscheiden -->
      <div class="abo-later">
        <button class="abo-later__btn" :disabled="busy" @click="skipForNow">Noch nicht — ich schau mich erst um</button>
      </div>

    </main>
  </div>
</template>

<script>
/**
 * WeWeb Coded Component — «Abo-Auswahl»
 * v2 (30.06.2026): Basis CHF 29 / Plus CHF 59 — 2 Pläne statt 5.
 * Monats/Jahres-Toggle, 30-Tage-Trial via stripe-checkout v11.
 */
export default {
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: false, default: '' },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: false, default: () => ({}) },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  data() {
    return {
      billing: 'month',
      selected: null,
      busy: false,
      errorMsg: '',
      priceIds: {
        basis_month: 'price_1TnxRXFLoauOOkHyLbCG9e4j',
        basis_year:  'price_1TnxRXFLoauOOkHyGTdJU7TP',
        plus_month:  'price_1TnxTOFLoauOOkHyOdAJo7vj',
        plus_year:   'price_1TnxTOFLoauOOkHyWUnmsk4z',
      },
    };
  },
  computed: {
    baseUrl() {
      let url = (this.content && this.content.supabaseUrl) || '';
      if (/nemxnflngcfrpamkuesm/.test(String(url))) url = '';
      return String(url).replace(/\/+$/, '');
    },
    apiKey() { return (this.content && this.content.apiKey) || ''; },
    authToken() {
      const t = (this.content && this.content.authToken) || '';
      return t.toString();
    },
    authHeaders() {
      const bearer = this.authToken.startsWith('Bearer ') ? this.authToken : `Bearer ${this.authToken}`;
      return { apikey: this.apiKey, Authorization: bearer };
    },
    onboardingUrl() { return ((this.content && this.content.onboardingUrl) || '/onboarding').toString(); },
    checkoutReturnUrl() { return ((this.content && this.content.checkoutReturnUrl) || '/onboarding').toString(); },
  },
  methods: {
    emitEvent(name, payload) { this.$emit('trigger-event', { name, event: payload || {} }); },
    selectPlan(plan) { this.selected = plan; },

    async startCheckout(planKey) {
      this.errorMsg = '';
      if (!this.authToken) { this.errorMsg = 'Du bist nicht eingeloggt. Bitte melde dich an.'; return; }
      const priceId = planKey === 'basis'
        ? (this.billing === 'year' ? this.priceIds.basis_year : this.priceIds.basis_month)
        : (this.billing === 'year' ? this.priceIds.plus_year  : this.priceIds.plus_month);

      this.busy = true;
      this.selected = planKey;
      this.emitEvent('checkout-started', { plan: planKey, billing: this.billing });
      try {
        const res = await fetch(`${this.baseUrl}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price_id: priceId,
            success_url: (typeof window !== 'undefined' ? window.location.origin : '') + this.checkoutReturnUrl + '?checkout=success',
            cancel_url:  (typeof window !== 'undefined' ? window.location.href : ''),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          this.errorMsg = 'Der Checkout konnte nicht gestartet werden. Versuch es gleich nochmal.';
          this.emitEvent('error', { reason: 'checkout', status: res.status, detail: (data && (data.error || data.message)) || '' });
          return;
        }
        if (typeof window !== 'undefined') window.location.href = data.url;
      } catch (e) {
        this.errorMsg = 'Netzwerkfehler. Bitte versuche es nochmal.';
        this.emitEvent('error', { reason: 'network' });
      } finally { this.busy = false; }
    },

    skipForNow() {
      this.emitEvent('skipped', {});
      if (typeof window !== 'undefined') window.location.href = this.onboardingUrl;
    },
  },
};
</script>

<!--
  Styles = einheitliches Design-System. Der folgende Block ist eine 1:1-Kopie von
  WeWeb-Components/Coded-Components-Vorlage/design-tokens.css (Quelle der Wahrheit),
  gefolgt von komponentenspezifischen Klassen, die ausschliesslich --hrk-*-Tokens nutzen.
  Nur design-tokens.css aendern und dann hier erneut kopieren.
-->
<style scoped>
/* ============================================================
   Imploya — Design-Tokens (einheitliches App-Design)
   Eine Datei fuer ALLE Coded Components (vertrag-anzeigen,
   mein-betrieb, meine-faelle, Kuendigung, Krankmeldung, ...).
   Stand: 2026-06-17 · Variante A (Auffrischung): flacher Schatten, feinere
   Linien, klarerer Hintergrund, groessere H1, Punkt-Badges. Bordeaux bleibt
   Primaer-/Headline-Farbe. Baut auf Design_Plan_HRklar_v2 auf.
   ============================================================ */

:root, .hrk-root {
  /* --- Markenfarben (aus Designplan v2, markenstimmig) --- */
  --hrk-bordeaux:        #7B2D3B;  /* Primaer: Knoepfe, Links, aktive Schritte */
  --hrk-bordeaux-dark:   #5E2129;  /* Hover/Pressed */
  --hrk-bordeaux-soft:   #F3E7E9;  /* zarte Flaeche (aktive Zeile, Chip-BG) */
  --hrk-creme:           #FBF8F3;  /* Seitenhintergrund (Variante A: klarer/ruhiger) */
  --hrk-anthrazit:       #2B2B2B;  /* Haupttext */
  --hrk-gold:            #C9A24B;  /* Akzent, sehr sparsam (Auszeichnung) */
  --hrk-gold-dark:       #B8902F;  /* Gold Hover/Pressed */
  --hrk-on-dark:         #FFFFFF;  /* Text/Icons auf dunklem (Bordeaux) Grund */
  --hrk-on-primary:     #FFFFFF;  /* Text/Icons auf primaer (Bordeaux) gefaerbten Flaechen */
  --hrk-on-dark-strong:  rgba(255,255,255,.92);
  --hrk-on-dark-soft:    rgba(255,255,255,.82);
  --hrk-on-dark-muted:   rgba(255,255,255,.40);
  --hrk-on-dark-faint:   rgba(255,255,255,.12);

  /* --- Neutrale Flaechen & Linien --- */
  --hrk-surface:         #FFFFFF;  /* Karten, Eingabefelder */
  --hrk-surface-muted:   #F5F1EB;  /* Sektions-Hintergrund, Tabellenkopf */
  --hrk-border:          #ECE5D9;  /* Linien, Feldraender (Variante A: feiner) */
  --hrk-border-strong:   #DAD2C6;
  --hrk-text:            #2B2B2B;
  --hrk-text-muted:      #6B6357;  /* Hilfetext, Labels, Platzhalter */

  /* --- Status-/Semantikfarben (Badges, Hinweise) --- */
  --hrk-success:         #2E7D5B;  --hrk-success-bg: #E5F1EB;
  --hrk-warning:         #B7791F;  --hrk-warning-bg: #FBF1DD;
  --hrk-danger:          #B23A48;  --hrk-danger-bg:  #F8E7E9;
  --hrk-info:            #2F6F9F;  --hrk-info-bg:    #E6F0F7;
  --hrk-neutral:         #6B6357;  --hrk-neutral-bg: #EFEAE2;

  /* --- Typografie --- */
  --hrk-font-head: "Fraunces", "Lora", Georgia, serif;        /* nur H1/H2 */
  --hrk-font-body: "Inter", "Source Sans 3", system-ui, sans-serif;
  --hrk-fs-h1: 1.9375rem; /* ~31px (Variante A: groesser) */
  --hrk-fs-h2: 1.375rem;  /* ~22px */
  --hrk-fs-h3: 1.125rem;  /* ~18px */
  --hrk-fs-body: 1.0625rem; /* 17px — Mindestgroesse Fliesstext */
  --hrk-fs-small: 0.9375rem; /* 15px */
  --hrk-lh-body: 1.55;
  --hrk-fw-regular: 400; --hrk-fw-medium: 500; --hrk-fw-semibold: 600;

  /* --- Abstaende (4px-Raster) --- */
  --hrk-space-1: 4px;  --hrk-space-2: 8px;  --hrk-space-3: 12px;
  --hrk-space-4: 16px; --hrk-space-5: 24px; --hrk-space-6: 32px;
  --hrk-space-7: 48px;

  /* --- Radien, Schatten, Fokus (weiche, warm getoente Schatten) --- */
  --hrk-radius-sm: 8px; --hrk-radius-md: 12px; --hrk-radius-lg: 14px;
  --hrk-radius-pill: 999px;
  --hrk-shadow-card: 0 1px 2px rgba(40,35,30,.05);
  --hrk-shadow-pop:  0 8px 28px rgba(40,35,30,.12);
  --hrk-focus-ring:  0 0 0 3px rgba(123,45,59,.30);

  /* --- Tap-Flaechen (Handy zuerst) --- */
  --hrk-tap-min: 44px;
  --hrk-page-max: 880px; /* lesbare Spaltenbreite */

  /* --- Overlay (Modals, Sheets) --- */
  --hrk-overlay: rgba(0,0,0,.55);

  /* --- Icon-Groessen (Inline-SVG, stroke=currentColor) --- */
  --hrk-icon-size-sm: 16px;
  --hrk-icon-size-md: 20px;
  --hrk-icon-size-lg: 28px;
}

/* ---------------- Basis ---------------- */
.hrk-root, .hrk-root * { box-sizing: border-box; }
.hrk-root {
  width: 100%;
  font-family: var(--hrk-font-body);
  font-size: var(--hrk-fs-body);
  line-height: var(--hrk-lh-body);
  color: var(--hrk-text);
  background: var(--hrk-creme);
  -webkit-font-smoothing: antialiased;
}
.hrk-page { width: 100%; max-width: var(--hrk-page-max); margin: 0 auto; padding: var(--hrk-space-6) var(--hrk-space-4); }
.hrk-h1 { font-family: var(--hrk-font-head); font-size: var(--hrk-fs-h1); font-weight: var(--hrk-fw-semibold); line-height: 1.12; letter-spacing: -.02em; color: var(--hrk-bordeaux); margin: 0 0 var(--hrk-space-3); }
.hrk-muted { color: var(--hrk-text-muted); }
.hrk-small { font-size: var(--hrk-fs-small); }

/* ---------------- Knoepfe ---------------- */
.hrk-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--hrk-space-2);
  min-height: var(--hrk-tap-min); padding: 0 var(--hrk-space-5);
  font: inherit; font-weight: var(--hrk-fw-semibold);
  border-radius: var(--hrk-radius-md); border: 1px solid transparent;
  cursor: pointer; text-decoration: none; transition: background .15s, border-color .15s, transform .05s;
}
.hrk-btn:active { transform: translateY(1px); }
.hrk-btn:focus-visible { outline: none; box-shadow: var(--hrk-focus-ring); }
.hrk-btn--primary   { background: var(--hrk-bordeaux); color: var(--hrk-on-primary); }
.hrk-btn--primary:hover { background: var(--hrk-bordeaux-dark); }
.hrk-btn--secondary { background: var(--hrk-surface); color: var(--hrk-bordeaux); border-color: var(--hrk-border-strong); }
.hrk-btn--secondary:hover { background: var(--hrk-bordeaux-soft); }
.hrk-btn--ghost     { background: transparent; color: var(--hrk-bordeaux); }
.hrk-btn--ghost:hover { background: var(--hrk-bordeaux-soft); }
.hrk-btn[disabled] { opacity: .5; cursor: not-allowed; }
.hrk-btn--block { width: 100%; }

/* ---------------- Karten ---------------- */
.hrk-card { background: var(--hrk-surface); border: 1px solid var(--hrk-border);
  border-radius: var(--hrk-radius-lg); box-shadow: var(--hrk-shadow-card);
  padding: var(--hrk-space-5); }

/* ---------------- Handy zuerst (≤600px) ---------------- */
@media (max-width: 600px) {
  :root, .hrk-root { --hrk-fs-h1: 1.625rem; }
  .hrk-page { padding: var(--hrk-space-4) var(--hrk-space-3); }
}

/* ============================================================
   Abo-Auswahl — komponentenspezifische Klassen, ausschliesslich
   auf Basis der --hrk-*-Tokens/hrk-card oben. Kein eigenes
   Farbsystem, kein color-mix()-Glow.
   ============================================================ */
.abo-root { font-family: inherit; color: inherit; }
.abo-page { max-width: 800px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }

/* Header */
.abo-header { text-align: center; margin-bottom: 2.5rem; }

/* Toggle */
.abo-toggle {
  display: inline-flex;
  background: var(--hrk-surface-muted);
  border: 1.5px solid var(--hrk-border);
  border-radius: var(--hrk-radius-pill);
  padding: 0.25rem;
  margin-top: 1.25rem;
  gap: 0.25rem;
}
.abo-toggle__btn {
  background: none;
  border: none;
  border-radius: var(--hrk-radius-pill);
  padding: 0.4rem 1.1rem;
  font-size: var(--hrk-fs-small);
  cursor: pointer;
  color: var(--hrk-text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s, color 0.15s;
}
.abo-toggle__btn--active {
  background: var(--hrk-surface);
  color: var(--hrk-text);
  font-weight: var(--hrk-fw-semibold);
  box-shadow: var(--hrk-shadow-card);
}
.abo-toggle__btn:focus-visible { outline: none; box-shadow: var(--hrk-focus-ring); }
.abo-toggle__save {
  font-size: 0.7rem;
  font-weight: var(--hrk-fw-semibold);
  background: var(--hrk-bordeaux-soft);
  color: var(--hrk-bordeaux);
  padding: 0.1rem 0.45rem;
  border-radius: var(--hrk-radius-pill);
}

/* Karten-Grid */
.abo-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 600px) {
  .abo-cards { grid-template-columns: 1fr; }
}

/* Karte — auf .hrk-card aufgebaut, hier nur Layout + Auswahl-/Empfehlungs-Zustand */
.abo-card {
  cursor: pointer;
  transition: border-color .15s, background .15s;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-width: 2px;
}
.abo-card:hover { border-color: var(--hrk-bordeaux); }
/* Ausgewaehlt: ruhiger Zustand, analog .hrk-radio--selected — Bordeaux-Rand + zarte Flaeche, kein Glow */
.abo-card--selected { border-color: var(--hrk-bordeaux); background: var(--hrk-bordeaux-soft); }
.abo-card--highlight { border-color: var(--hrk-bordeaux); }

.abo-card__badge {
  font-size: 0.7rem;
  font-weight: var(--hrk-fw-semibold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--hrk-bordeaux);
  background: var(--hrk-bordeaux-soft);
  padding: 0.2rem 0.6rem;
  border-radius: var(--hrk-radius-pill);
  align-self: flex-start;
}
.abo-card__name { font-family: var(--hrk-font-head); font-size: 1.35rem; font-weight: var(--hrk-fw-semibold); color: var(--hrk-bordeaux); margin: 0; }
.abo-card__price { display: flex; align-items: baseline; gap: 0.25rem; }
.abo-card__amount { font-size: 2rem; font-weight: 800; color: var(--hrk-text); }
.abo-card__period { font-size: var(--hrk-fs-small); color: var(--hrk-text-muted); }
.abo-card__saving { font-size: 0.78rem; color: var(--hrk-bordeaux); font-weight: var(--hrk-fw-semibold); margin: -0.25rem 0 0; }
.abo-card__tagline { font-size: var(--hrk-fs-small); color: var(--hrk-text-muted); margin: 0; }

.abo-card__features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; font-size: var(--hrk-fs-small); }
.abo-card__feat--dim { color: var(--hrk-text-muted); }
.abo-card__cta { width: 100%; margin-top: 0.5rem; }

/* Extras-Hinweis */
.abo-hint-extra { text-align: center; font-size: 0.82rem; color: var(--hrk-text-muted); margin-top: 1.25rem; }

/* Fehler */
.abo-error { color: var(--hrk-danger); font-size: var(--hrk-fs-small); text-align: center; margin-top: 1rem; }

/* Später */
.abo-later { text-align: center; margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.abo-later__btn {
  background: none; border: none; cursor: pointer;
  color: var(--hrk-text-muted); font-size: var(--hrk-fs-small);
  text-decoration: underline; padding: 0.25rem 0.5rem;
}
.abo-later__btn:hover { color: var(--hrk-text); }
.abo-later__btn:focus-visible { outline: none; box-shadow: var(--hrk-focus-ring); border-radius: var(--hrk-radius-sm); }
.abo-later__btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
