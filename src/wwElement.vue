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

      <!-- Plan-Karte (Ein-Plan-Modell seit 02.08.2026, Plus eingestellt) -->
      <div class="abo-cards abo-cards--single">

        <!-- BASIS -->
        <div class="hrk-card abo-card abo-card--selected" @click="selectPlan('basis')">
          <h2 class="abo-card__name">Imploya</h2>
          <div class="abo-card__price">
            <span class="abo-card__amount">CHF {{ billing === 'year' ? '290' : '29' }}</span>
            <span class="abo-card__period">{{ billing === 'year' ? '/Jahr' : '/Monat' }}</span>
          </div>
          <p v-if="billing === 'year'" class="abo-card__saving">statt CHF 348/Jahr — 2 Monate gratis</p>
          <p class="abo-card__tagline">Alles, was dein Betrieb für die HR-Basics braucht.</p>
          <ul class="abo-card__features">
            <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>Emily — 30 Fragen/Monat</li>
            <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>15 Dokumente/Monat</li>
            <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>Vertrag, Kündigung, Krankmeldung</li>
            <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>Zeugnis, Verwarnung, Stelleninserat</li>
            <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>Personaldossier & Dokumente-Upload</li>
          </ul>
          <button
            class="hrk-btn hrk-btn--primary abo-card__cta"
            :disabled="busy"
            @click.stop="startCheckout('basis')"
          >{{ busy && selected === 'basis' ? 'Einen Moment …' : 'Jetzt starten' }}</button>
        </div>

      </div>

      <!-- Fehler -->
      <p v-if="errorMsg" class="abo-error" role="alert">{{ errorMsg }}</p>

      <!-- Hinweis Einzelpreise -->
      <!-- W32 (Neukunden-Audit 24.08.2026, von Richard bestaetigt 25.08.): diese Zeile
           steht direkt unter der Abo-Karte (30 Emily-Fragen/Monat inklusive) — hier
           gilt der Abo-Preis fuer weitere Fragen, CHF 4, nicht der volle Preis CHF 9
           ohne Abo. "Zusätzliche Dokumente CHF 3/Stück" war schon korrekt (Abo-Preis). -->
      <p class="abo-hint-extra">Zusätzliche Dokumente CHF 3/Stück · Extra Emily-Fragen CHF 4/10 Fragen</p>

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
 * v3 (01.08.2026, K2-Audit-Fix): Kontingent-Zahlen korrigiert (waren seit der
 *   subscription_limits-Anhebung vom 24.07. veraltet) + Einheit Woche->Monat.
 *   Basis: 5 Dok./20 Emily-Woche -> 15 Dok./30 Emily-Monat.
 *   Plus:  30 Emily-Woche -> 30 Emily-Monat (Dok.-Zahl 25 war bereits korrekt).
 *   Quelle: subscription_limits + check_service_limit-RPC (monatlich, kein Wochenkontingent).
 * v4 (02.08.2026, Richards Entscheid): Ein-Plan-Modell — Plus eingestellt (plan_prices.active
 *   auf false gesetzt, keine Kunden betroffen, 0 aktive plus-Abos zum Zeitpunkt der Umstellung).
 *   Nur noch Basis CHF 29/Mt bzw. CHF 290/Jahr.
 * v5 (14.09.2026, ECC-vue#1): fetchWithTimeout ergaenzt (Muster vertrag-erstellen/dashboard-start,
 *   20s) — Token-Refresh und beide stripe-checkout-Aufrufe (Erst- und 401-Retry) liefen bisher
 *   ohne Zeitlimit; der Button haette bei einer haengenden Verbindung ewig auf "Einen Moment ..."
 *   stehen bleiben koennen. Bei Timeout eigene Meldung ("Verbindung dauert zu lange, bitte nochmals
 *   versuchen.") statt der generischen Netzwerkfehler-Meldung, Button wird ueber das bestehende
 *   finally (busy = false) wieder freigegeben.
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
    // Token LIVE lesen: Prop (WeWeb-Binding) -> globalContext (Live-Session) -> localStorage
    // (persistierte Supabase-Session). Das Prop-Binding hinkt nach Login/Refresh hinterher —
    // nach 60 Min waere der Checkout sonst still kaputt (Muster: vertrag-erstellen).
    authToken() {
      const fromProp = ((this.content && this.content.authToken) || '').toString().trim();
      if (fromProp) return fromProp;
      try {
        const auth = (typeof wwLib !== 'undefined' && wwLib.globalContext && wwLib.globalContext.auth) ? wwLib.globalContext.auth : null;
        const at = auth && auth.session && auth.session.access_token;
        if (at) return String(at).trim();
      } catch (e) { /* ignore */ }
      try {
        const win = (typeof wwLib !== 'undefined' && wwLib.getFrontWindow) ? wwLib.getFrontWindow() : (typeof window !== 'undefined' ? window : null);
        const ls = win && win.localStorage;
        if (ls) {
          const raw = ls.getItem('sb-ztvqsxdudzdyqgeylujr-auth-token');
          if (raw) {
            const o = JSON.parse(raw);
            const at = (o && o.access_token) || (o && o.currentSession && o.currentSession.access_token);
            if (at) return String(at).trim();
          }
        }
      } catch (e) { /* ignore */ }
      return '';
    },
    authHeaders() {
      const bearer = this.authToken.startsWith('Bearer ') ? this.authToken : `Bearer ${this.authToken}`;
      return { apikey: this.apiKey, Authorization: bearer };
    },
    // Entscheid 1 (20.09.2026): '/vertrag-erstellen' ist die Vertrags-Strecke,
    // '/onboarding' wird Weiterleitung. Kopf- und Fusszeile biegen den Altwert
    // seit dem 20.09. beim Rendern um; diese Komponente zog nicht mit und schickte
    // den Kunden nach «Später» und nach dem bezahlten Checkout weiterhin in den
    // alten Wizard. Ein neuer ww-config-Default allein reicht dafuer nicht — er
    // erreicht bestehende Instanzen nie (Auto-Memory
    // weweb-ww-config-default-erreicht-live-nie), darum dieselbe Umschreibung
    // beim Rendern wie im Kopf.
    onboardingUrl() { return this.zielUmbiegen((this.content && this.content.onboardingUrl) || '/vertrag-erstellen'); },
    checkoutReturnUrl() { return this.zielUmbiegen((this.content && this.content.checkoutReturnUrl) || '/vertrag-erstellen'); },
  },
  methods: {
    // Altwerte, die auf den Instanzen gebunden sind, beim Rendern auf das heutige
    // Ziel umschreiben. Wortlaut und Begruendung wie in coded-component-header-pro;
    // dort steht die vollstaendige Messung vom 20.09.2026 (39 von 47 Kopf-Instanzen
    // zeigten auf '/onboarding'). Unbekannte Werte bleiben unveraendert.
    zielUmbiegen(v) {
      const REDIRECT = {
        '/onboarding': '/vertrag-erstellen',
        '/seite---vertrag-erstellen': '/vertrag-erstellen',
        '/vertrag-erstellen-probe': '/vertrag-erstellen',
      };
      return REDIRECT[String(v).trim()] || String(v);
    },
    emitEvent(name, payload) { this.$emit('trigger-event', { name, event: payload || {} }); },
    selectPlan(plan) { this.selected = plan; },

    // fetch mit Timeout (AbortController) — bricht haengende Requests nach ms ab, damit der
    // "Jetzt starten"-Button nie ewig auf "Einen Moment ..." stehen bleibt (Muster: vertrag-
    // erstellen / dashboard-start). Abbruch landet als AbortError im jeweiligen catch.
    async fetchWithTimeout(url, options, ms) {
      const timeout = ms || 20000;
      const ac = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const timer = ac ? setTimeout(() => ac.abort(), timeout) : null;
      try {
        return await fetch(url, ac ? Object.assign({}, options, { signal: ac.signal }) : options);
      } finally {
        if (timer) clearTimeout(timer);
      }
    },

    // Bei 401 das Supabase-Token via GoTrue (refresh_token) erneuern + Session zurueckschreiben
    // (Muster: vertrag-erstellen). Gibt das frische access_token zurueck oder ''.
    async _refreshAuthToken() {
      try {
        const auth = (typeof wwLib !== 'undefined' && wwLib.globalContext && wwLib.globalContext.auth) ? wwLib.globalContext.auth : null;
        let rt = auth && auth.session && auth.session.refresh_token;
        if (!rt) {
          try {
            const win = (typeof wwLib !== 'undefined' && wwLib.getFrontWindow) ? wwLib.getFrontWindow() : (typeof window !== 'undefined' ? window : null);
            const raw = win && win.localStorage && win.localStorage.getItem('sb-ztvqsxdudzdyqgeylujr-auth-token');
            if (raw) { const o = JSON.parse(raw); rt = (o && o.refresh_token) || (o && o.currentSession && o.currentSession.refresh_token); }
          } catch (e) { /* ignore */ }
        }
        if (!rt || !this.apiKey) return '';
        const res = await this.fetchWithTimeout(`${this.baseUrl}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST', headers: { apikey: this.apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
        if (!res.ok) return '';
        const ns = await res.json();
        if (!ns || !ns.access_token) return '';
        try {
          const win = (typeof wwLib !== 'undefined' && wwLib.getFrontWindow) ? wwLib.getFrontWindow() : (typeof window !== 'undefined' ? window : null);
          const ls = win && win.localStorage;
          const wwSess = { access_token: ns.access_token, token_type: ns.token_type, expires_in: ns.expires_in, expires_at: ns.expires_at, refresh_token: ns.refresh_token };
          if (ls) {
            ls.setItem('ww-auth-session', JSON.stringify(wwSess));
            const ref = ((String(this.baseUrl || '').match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i) || [])[1]) || 'ztvqsxdudzdyqgeylujr';
            const k = `sb-${ref}-auth-token`; const cur = JSON.parse(ls.getItem(k) || '{}');
            ls.setItem(k, JSON.stringify(Object.assign(cur, wwSess, { user: ns.user || cur.user })));
          }
          if (auth && auth.session) Object.assign(auth.session, wwSess);
        } catch (e) { /* writeback best-effort */ }
        return ns.access_token;
      } catch (e) { return ''; }
    },

    async startCheckout(planKey) {
      this.errorMsg = '';
      if (!this.authToken) { this.errorMsg = 'Du bist nicht eingeloggt. Bitte melde dich an.'; return; }
      const priceId = this.billing === 'year' ? this.priceIds.basis_year : this.priceIds.basis_month;

      this.busy = true;
      this.selected = planKey;
      this.emitEvent('checkout-started', { plan: planKey, billing: this.billing });
      try {
        const body = JSON.stringify({
          price_id: priceId,
          success_url: (typeof window !== 'undefined' ? window.location.origin : '') + this.checkoutReturnUrl + '?checkout=success',
          cancel_url:  (typeof window !== 'undefined' ? window.location.href : ''),
        });
        let res = await this.fetchWithTimeout(`${this.baseUrl}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
          body,
        });
        if (res.status === 401) {
          // Session evtl. nur abgelaufen — Token erneuern und EINMAL wiederholen, statt Fehler.
          const fresh = await this._refreshAuthToken();
          if (fresh) {
            res = await this.fetchWithTimeout(`${this.baseUrl}/functions/v1/stripe-checkout`, {
              method: 'POST',
              headers: { apikey: this.apiKey, Authorization: `Bearer ${fresh}`, 'Content-Type': 'application/json' },
              body,
            });
          }
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          this.errorMsg = 'Der Checkout konnte nicht gestartet werden. Versuch es gleich nochmal.';
          this.emitEvent('error', { reason: 'checkout', status: res.status, detail: (data && (data.error || data.message)) || '' });
          return;
        }
        if (typeof window !== 'undefined') window.location.href = data.url;
      } catch (e) {
        // Timeout (AbortController-Abbruch nach fetchWithTimeout) bekommt eine eigene,
        // verstaendliche Meldung statt des generischen Netzwerkfehlers.
        if (e && e.name === 'AbortError') {
          this.errorMsg = 'Verbindung dauert zu lange, bitte nochmals versuchen.';
          this.emitEvent('error', { reason: 'timeout' });
        } else {
          this.errorMsg = 'Netzwerkfehler. Bitte versuche es nochmal.';
          this.emitEvent('error', { reason: 'network' });
        }
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
  --hrk-creme: #F7F5F1;  /* Seitenhintergrund (Variante A: klarer/ruhiger) */
  --hrk-anthrazit: #241F1C;  /* Haupttext */
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
  --hrk-surface-muted: #F2EFEA;  /* Sektions-Hintergrund, Tabellenkopf */
  --hrk-border: #E2DDD5;  /* Linien, Feldraender (Variante A: feiner) */
  --hrk-border-strong: #CFC8BD;
  --hrk-text: #241F1C;
  --hrk-text-muted:      #6B6357;  /* Hilfetext, Labels, Platzhalter */

  /* --- Status-/Semantikfarben (Badges, Hinweise) --- */
  --hrk-success: #2A7254;  --hrk-success-bg: #E5F1EB;
  --hrk-warning: #946010;  --hrk-warning-bg: #FBF1DD;
  --hrk-danger:          #B23A48;  --hrk-danger-bg:  #F8E7E9;
  --hrk-info:            #2F6F9F;  --hrk-info-bg:    #E6F0F7;
  --hrk-neutral:         #6B6357;  --hrk-neutral-bg: #EFEAE2;

  /* --- Typografie --- */
  --hrk-font-head: "Archivo", "Inter", system-ui, sans-serif;        /* nur H1/H2 */
  --hrk-font-body: "Inter", "Source Sans 3", system-ui, sans-serif;
  --hrk-fs-h1: 1.875rem; /* ~31px (Variante A: groesser) */
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
  --hrk-radius-sm: 6px; --hrk-radius-md: 6px; --hrk-radius-lg: 10px;
  --hrk-radius-pill: 6px;
  --hrk-shadow-card: 0 1px 2px rgba(40,35,30,.05);
  --hrk-shadow-pop: 0 1px 2px rgba(40,35,30,.05);
  --hrk-focus-ring: 0 0 0 3px rgba(51,71,91,.35);

  /* --- Tap-Flaechen (Handy zuerst) --- */
  --hrk-tap-min: 44px;
  --hrk-page-max: 880px; /* lesbare Spaltenbreite */

  /* --- Overlay (Modals, Sheets) --- */
  --hrk-overlay: rgba(20,24,28,.55);

  /* --- Icon-Groessen (Inline-SVG, stroke=currentColor) --- */
  --hrk-icon-size-sm: 16px;
  --hrk-icon-size-md: 20px;
  --hrk-icon-size-lg: 28px;
  /* Design-Umsetzung 23.09.2026 (Phase 1): Schiefer, Schriften, zwei Radien, ein Schatten */
  --hrk-schiefer: #33475B;
  --hrk-schiefer-dark: #243444;
  --hrk-schiefer-soft: #EBEEF1;
  --hrk-font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  --hrk-font-brand: "Fraunces", Georgia, serif;
  --hrk-fs-xs: 0.8125rem;
  --hrk-ls-caps: .06em;
  --hrk-radius-field: 6px;
  --hrk-radius-card: 10px;
  --hrk-shadow: 0 1px 2px rgba(40,35,30,.05);
  --hrk-page-wide: 1200px;
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
.hrk-h1 { font-family: var(--hrk-font-head); font-size: var(--hrk-fs-h1); font-weight: var(--hrk-fw-semibold); line-height: 1.12; letter-spacing: -.02em; color: var(--hrk-text); margin: 0 0 var(--hrk-space-3); }
.hrk-muted { color: var(--hrk-text-muted); }
.hrk-small { font-size: var(--hrk-fs-small); }

/* ---------------- Knoepfe ---------------- */
.hrk-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--hrk-space-2);
  min-height: var(--hrk-tap-min); padding: 0 var(--hrk-space-5);
  font: inherit; font-weight: var(--hrk-fw-semibold);
  border-radius: var(--hrk-radius-field); border: 1px solid transparent;
  cursor: pointer; text-decoration: none; transition: background .15s, border-color .15s, transform .05s;
}
.hrk-btn:active { transform: translateY(1px); }
.hrk-btn:focus-visible { outline: none; box-shadow: var(--hrk-focus-ring); }
.hrk-btn--primary   { background: var(--hrk-bordeaux); color: var(--hrk-on-primary); }
.hrk-btn--primary:hover { background: var(--hrk-bordeaux-dark); }
.hrk-btn--secondary { background: var(--hrk-surface); color: var(--hrk-schiefer); border-color: var(--hrk-border-strong); }
.hrk-btn--secondary:hover { background: var(--hrk-schiefer-soft); }
.hrk-btn--ghost     { background: transparent; color: var(--hrk-schiefer); }
.hrk-btn--ghost:hover { background: var(--hrk-schiefer-soft); }
.hrk-btn[disabled] { opacity: .5; cursor: not-allowed; }
.hrk-btn--block { width: 100%; }

/* ---------------- Karten ---------------- */
.hrk-card { background: var(--hrk-surface); border: 1px solid var(--hrk-border);
  border-radius: var(--hrk-radius-card); box-shadow: var(--hrk-shadow);
  padding: var(--hrk-space-5); }

/* ---------------- Icons (Inline-SVG, Katalog ICONS.md) ---------------- */
.hrk-icon { width: var(--hrk-icon-size-md); height: var(--hrk-icon-size-md); flex: none; }
.hrk-icon--sm { width: var(--hrk-icon-size-sm); height: var(--hrk-icon-size-sm); }
.hrk-icon--lg { width: var(--hrk-icon-size-lg); height: var(--hrk-icon-size-lg); }

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
.abo-root { font-family: var(--hrk-font-body); color: var(--hrk-text); }
.abo-page { max-width: 800px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }

/* Header */
.abo-header { text-align: center; margin-bottom: 2.5rem; }

/* Toggle */
.abo-toggle {
  display: inline-flex;
  background: var(--hrk-surface-muted);
  border: 1.5px solid var(--hrk-border);
  border-radius: var(--hrk-radius-field);
  padding: 0.25rem;
  margin-top: 1.25rem;
  gap: 0.25rem;
}
.abo-toggle__btn {
  background: none;
  border: none;
  border-radius: var(--hrk-radius-field);
  min-height: var(--hrk-tap-min);
  padding: 0.4rem 1.1rem;
  font: inherit;
  font-family: var(--hrk-font-head);
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
  color: var(--hrk-schiefer);
  font-weight: var(--hrk-fw-semibold);
  box-shadow: var(--hrk-shadow);
}
.abo-toggle__btn:focus-visible { outline: none; box-shadow: var(--hrk-focus-ring); }
.abo-toggle__save {
  font-size: var(--hrk-fs-small);
  font-weight: var(--hrk-fw-semibold);
  background: var(--hrk-schiefer-soft);
  color: var(--hrk-schiefer);
  padding: 0.1rem 0.45rem;
  border-radius: var(--hrk-radius-field);
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
/* Ein-Plan-Modell: eine zentrierte, breitenbegrenzte Karte statt Zwei-Spalten-Grid */
.abo-cards--single {
  grid-template-columns: 1fr;
  max-width: 380px;
  margin: 0 auto;
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
.abo-card:hover { border-color: var(--hrk-schiefer); }
/* Ausgewaehlt: ruhiger Zustand, analog .hrk-radio--selected — Schiefer-Rand + zarte Flaeche, kein Glow
   (Design-Umsetzung 23.09.2026: Auswahl-Zustaende sind Schiefer, Bordeaux nur der Haupt-Knopf) */
.abo-card--selected { border-color: var(--hrk-schiefer); background: var(--hrk-schiefer-soft); }
.abo-card--highlight { border-color: var(--hrk-schiefer); }

.abo-card__badge {
  font-family: var(--hrk-font-head);
  font-size: var(--hrk-fs-small);
  font-weight: var(--hrk-fw-semibold);
  letter-spacing: var(--hrk-ls-caps);
  text-transform: uppercase;
  color: var(--hrk-schiefer);
  background: var(--hrk-schiefer-soft);
  padding: 0.2rem 0.6rem;
  border-radius: var(--hrk-radius-field);
  align-self: flex-start;
}
.abo-card__name { font-family: var(--hrk-font-head); font-size: var(--hrk-fs-h2); font-weight: var(--hrk-fw-semibold); color: var(--hrk-text); margin: 0; }
.abo-card__price { display: flex; align-items: baseline; gap: 0.25rem; }
/* Display-Zahl: 2rem bleibt bewusst (Ausnahme Phase 1, wie dashboard-start .dsb__stat-num) */
.abo-card__amount { font-family: var(--hrk-font-mono); font-variant-numeric: tabular-nums; font-size: 2rem; font-weight: var(--hrk-fw-medium); color: var(--hrk-text); }
.abo-card__period { font-size: var(--hrk-fs-small); color: var(--hrk-text-muted); }
.abo-card__saving { font-size: var(--hrk-fs-small); color: var(--hrk-schiefer); font-weight: var(--hrk-fw-semibold); margin: -0.25rem 0 0; }
.abo-card__tagline { font-size: var(--hrk-fs-body); color: var(--hrk-text-muted); margin: 0; }

.abo-card__features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; font-size: var(--hrk-fs-body); }
.abo-card__features li { display: flex; align-items: flex-start; gap: var(--hrk-space-2); }
.abo-card__check { color: var(--hrk-schiefer); margin-top: 5px; }
.abo-card__feat--dim { color: var(--hrk-text-muted); }
.abo-card__cta { width: 100%; margin-top: 0.5rem; }

/* Extras-Hinweis */
.abo-hint-extra { text-align: center; font-size: var(--hrk-fs-small); color: var(--hrk-text-muted); margin-top: 1.25rem; }

/* Fehler */
.abo-error { color: var(--hrk-danger); font-size: var(--hrk-fs-small); text-align: center; margin-top: 1rem; }

/* Später */
.abo-later { text-align: center; margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.abo-later__btn {
  background: none; border: none; cursor: pointer;
  font: inherit;
  color: var(--hrk-text-muted); font-size: var(--hrk-fs-small);
  text-decoration: underline; padding: 0.25rem 0.5rem;
  min-height: var(--hrk-tap-min);
}
.abo-later__btn:hover { color: var(--hrk-text); }
.abo-later__btn:focus-visible { outline: none; box-shadow: var(--hrk-focus-ring); border-radius: var(--hrk-radius-field); }
.abo-later__btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
