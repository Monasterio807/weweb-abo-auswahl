<template>
  <div class="hrk-root abo-root">
    <main class="abo-main hrk-page">

      <!-- Kopf: Archivo-Label, grosser Gloock-Titel, Einleitung (Stil A, Entscheid 13.10.2026) -->
      <header class="abo-top">
        <div class="abo-wrap abo-header">
          <p class="abo-lab" aria-hidden="true">Abo</p>
          <!-- Fix-Runde 24.09.2026 (s6-B11 Entscheid 9, s6-B10 Entscheid 7): Planname «Basis», Gratismonat-Satz wie auf /abo, Preis aus plan_prices. -->
          <h1 class="hrk-h1 abo-h1">Wähle dein Abo</h1>
          <p v-if="einleitung" class="hrk-muted abo-intro">{{ einleitung }}</p>
        </div>
      </header>

      <!-- Plan (Ein-Plan-Modell seit 02.08.2026, Plus eingestellt): Label-Spalte links, Inhalt rechts, Linien statt Karte -->
      <section class="abo-band">
        <div class="abo-wrap abo-cards abo-cards--single">

          <!-- BASIS -->
          <div class="abo-card abo-card--selected" @click="selectPlan('basis')">
            <div class="abo-card__lab">
              <span class="abo-nr" aria-hidden="true">01</span>
              <h2 class="abo-card__name">Basis</h2>
            </div>

            <div class="abo-card__body">
              <!-- Billing Toggle: Text-Reiter statt Kasten -->
              <div class="abo-toggle">
                <button
                  type="button"
                  class="abo-toggle__btn"
                  :class="{ 'abo-toggle__btn--active': billing === 'month' }"
                  :aria-pressed="billing === 'month' ? 'true' : 'false'"
                  @click.stop="billing = 'month'"
                >Monatlich</button>
                <button
                  type="button"
                  class="abo-toggle__btn"
                  :class="{ 'abo-toggle__btn--active': billing === 'year' }"
                  :aria-pressed="billing === 'year' ? 'true' : 'false'"
                  @click.stop="billing = 'year'"
                >Jährlich <span class="abo-toggle__save">1 Monat gratis</span></button>
              </div>

              <div class="abo-card__price">
                <span class="abo-card__amount">CHF {{ billing === 'year' ? preisJahrChf : preisMonatChf }}</span>
                <span class="abo-card__period">{{ billing === 'year' ? '/Jahr' : '/Monat' }}</span>
              </div>
              <!-- Fix-Runde 24.09.2026 (s6-B02, Entscheid 8): Bezugspreis = inaktive Normalpreis-Zeile aus plan_prices, nie 12 x Aktionspreis. -->
              <p v-if="billing === 'year'" class="abo-card__saving">{{ sparHinweis }}</p>
              <p class="abo-card__tagline">Alles, was dein Betrieb für die HR-Basics braucht.</p>
              <ul class="abo-card__features">
                <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>30 Fragen an Emily pro Monat</li>
                <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>15 Dokumente pro Monat</li>
                <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>Vertrag, Kündigung, Krankmeldung</li>
                <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>Zeugnis, Verwarnung</li>
                <li><svg class="hrk-icon hrk-icon--sm abo-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="5,12.5 10,17.5 19,7"/></svg>Mitarbeitende & Dokumente-Upload</li>
              </ul>

              <!-- Fehler -->
              <p v-if="errorMsg" class="abo-error" role="alert">{{ errorMsg }}<template v-if="errorLink"> <a class="abo-error__link" :href="aboUrl">Zur Abo-Verwaltung</a></template></p>

              <!-- Die eine Hauptaktion: Schiefer-Text, 2 px Gold-Unterstrich, Pfeil -->
              <div class="abo-actions">
                <button
                  type="button"
                  class="abo-fw abo-card__cta"
                  :disabled="busy"
                  @click.stop="startCheckout('basis')"
                >{{ busy && selected === 'basis' ? 'Einen Moment …' : 'Jetzt starten' }} <svg class="hrk-icon hrk-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="13,6 19,12 13,18"/></svg></button>
              </div>

              <!-- Hinweis Einzelpreise -->
              <!-- W32 (Neukunden-Audit 24.08.2026, von Richard bestaetigt 25.08.): diese Zeile
                   steht direkt unter der Abo-Karte (30 Emily-Fragen/Monat inklusive) — hier
                   gilt der Abo-Preis fuer weitere Fragen, CHF 4, nicht der volle Preis CHF 9
                   ohne Abo. "Zusätzliche Dokumente CHF 3/Stück" war schon korrekt (Abo-Preis). -->
              <p class="abo-hint-extra">Zusätzliche Dokumente CHF 3/Stück · Extra Emily-Fragen CHF 4/10 Fragen</p>
            </div>
          </div>

        </div>
      </section>

      <!-- Später entscheiden: Zweitweg, grauer Text mit Haarlinie -->
      <div class="abo-wrap abo-later">
        <button type="button" class="abo-later__btn" :disabled="busy" @click="skipForNow">Noch nicht, ich schau mich erst um</button>
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
 *   Nur noch Basis CHF 29/Mt bzw. CHF 319/Jahr (1 Monat gratis, Richard 18.10.2026).
 * v5 (14.09.2026, ECC-vue#1): fetchWithTimeout ergaenzt (Muster vertrag-erstellen/dashboard-start,
 *   20s) — Token-Refresh und beide stripe-checkout-Aufrufe (Erst- und 401-Retry) liefen bisher
 *   ohne Zeitlimit; der Button haette bei einer haengenden Verbindung ewig auf "Einen Moment ..."
 *   stehen bleiben koennen. Bei Timeout eigene Meldung ("Verbindung dauert zu lange, bitte nochmals
 *   versuchen.") statt der generischen Netzwerkfehler-Meldung, Button wird ueber das bestehende
 *   finally (busy = false) wieder freigegeben.
 * v6 (14.10.2026, Design-Entscheid 13.10.): nur Optik auf Stil A «Editorial» umgestellt (Linien statt Karte,
 *   Gloock-Titel, Text-Knopf mit Gold-Unterstrich). Logik, Preise, Texte unveraendert.
 */
function hrkEnsureBrandFont() {
  try {
    const doc = (typeof wwLib !== 'undefined' && wwLib && typeof wwLib.getFrontDocument === 'function')
      ? wwLib.getFrontDocument()
      : (typeof document !== 'undefined' ? document : null);
    if (!doc || !doc.head || doc.getElementById('hrk-fonts-marke')) return;
    const link = doc.createElement('link');
    link.id = 'hrk-fonts-marke'; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600&family=Gloock&family=Inter:wght@400;500;600&display=swap';
    doc.head.appendChild(link);
  } catch (e) { /* Georgia als Rueckfall */ }
}

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
      // Nach-Audit 03.10.2026 ([82]): true = unter der Fehlermeldung steht der Link zur Abo-Verwaltung
      // (nur bei «du hast schon ein Abo»).
      errorLink: false,
      // Fix-Runde 24.09.2026 (s6-B02): plan_prices-Zeilen des Basis-Plans (aktive und
      // inaktive Normalpreise). Leer, solange nichts geladen ist.
      preise: [],
      // Nachbesserung 24.09.2026 (Prüfung W1): wie /abo (abo-verwalten). true = noch keine
      // subscriptions-Zeile, also Gratismonat laut stripe-checkout «Trial prüfen»; false = hatte
      // schon ein Abo; null = unbekannt (nicht angemeldet, keine user_id oder Lesefehler).
      trialBerechtigt: null,
      priceIds: {
        basis_month: 'price_1TnxRXFLoauOOkHyLbCG9e4j',
        basis_year:  'price_1USIfzFLoauOOkHy6yp9t1N0',
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
    // Nach-Audit 03.10.2026 ([82]): Ziel fuer Kunden, die schon ein Abo haben. Eigene Property, mit
    // festem Rueckfall, damit auch bestehende Instanzen ohne den neuen Wert den Link bekommen.
    aboUrl() { return (this.content && this.content.aboUrl) || '/abo'; },
    checkoutReturnUrl() { return this.zielUmbiegen((this.content && this.content.checkoutReturnUrl) || '/vertrag-erstellen'); },

    // ---- Fix-Runde 24.09.2026 (Vollaudit Kundensicht, F29) ----
    // Die Karte zeigt den Betrag der plan_prices-Zeile, deren stripe_price_id der Checkout
    // wirklich sendet (priceIds). Ist die Tabelle (noch) nicht geladen, bleibt der bisherige
    // Anzeigewert stehen (29/319, Richard 18.10.2026; vorher 29/290), damit die
    // Karte nie ohne Preis dasteht. Neue Zahlen (Bezugspreis) gibt es NUR aus der DB.
    zeileMonat() { return this.preise.find(p => p.active !== false && p.stripe_price_id === this.priceIds.basis_month) || null; },
    zeileJahr() { return this.preise.find(p => p.active !== false && p.stripe_price_id === this.priceIds.basis_year) || null; },
    preisMonatChf() { return this.zeileMonat ? this.chf(this.zeileMonat.amount_rappen) : '29'; },
    preisJahrChf() { return this.zeileJahr ? this.chf(this.zeileJahr.amount_rappen) : '319'; },
    // Entscheid 8 (20.09.2026): verglichen wird mit dem Normalpreis (inaktive, teurere
    // Jahreszeile des Basis-Plans, live 39000), nicht mit 12 x Aktionspreis (348).
    normalJahrChf() {
      if (!this.zeileJahr) return '';
      const n = this.preise
        .filter(p => p.active === false && p.interval === 'year' && p.amount_rappen > this.zeileJahr.amount_rappen)
        .sort((a, b) => b.amount_rappen - a.amount_rappen)[0];
      return n ? this.chf(n.amount_rappen) : '';
    },
    sparHinweis() {
      return this.normalJahrChf ? `statt CHF ${this.normalJahrChf} im Jahr, 1 Monat gratis` : '1 Monat gratis';
    },
    // s6-B10 (Entscheid 7), gleicher Wortlaut wie /abo (abo-verwalten). «jederzeit kündbar»
    // ist eine Vertragsaussage und fällt weg; «ohne Kreditkarte» deckt stripe-checkout
    // (payment_method_collection 'if_required'), aber nur im Gratismonat.
    // Nachbesserung 24.09.2026: (W1) Gratis-Versprechen nur bei trialBerechtigt === true,
    // Rückkehrer lesen den Preis ohne Gratismonat, unbekannt = vorsichtiger Wortlaut;
    // (K1) Betrag passend zum Umschalter (Monat/Jahr); (K3) ohne geladene plan_prices-Zeile
    // kein Betrag im Satz (die Karte behält ihren Anzeigewert).
    einleitung() {
      const zeile = this.billing === 'year' ? this.zeileJahr : this.zeileMonat;
      const betrag = zeile
        ? (this.billing === 'year' ? `CHF ${this.preisJahrChf} im Jahr` : `CHF ${this.preisMonatChf} im Monat`)
        : '';
      const danach = betrag ? ` Danach zahlst du ${betrag}.` : '';
      if (this.trialBerechtigt === true) return `Der erste Monat im Abo ist gratis, ohne Kreditkarte.${danach}`;
      if (this.trialBerechtigt === false) return betrag ? `Das Abo kostet ${betrag}.` : '';
      return `Beim ersten Abo ist der erste Monat gratis, ohne Kreditkarte.${danach}`;
    },
    // user_id (sub) aus dem JWT fuer den expliziten Filter (RLS-Admin-Zweig, wie abo-verwalten).
    userId() {
      try {
        const part = String(this.authToken || '').replace(/^Bearer\s+/i, '').split('.')[1];
        if (!part) return '';
        const json = JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g, '+').replace(/_/g, '/')))));
        return (json && json.sub) ? String(json.sub) : '';
      } catch (e) { return ''; }
    },
  },
  watch: {
    'content.supabaseUrl'() { this.ladePreise(); this.ladeTrial(); },
    'content.apiKey'() { this.ladePreise(); this.ladeTrial(); },
    'content.authToken'() { this.ladeTrial(); },
  },
  mounted() { hrkEnsureBrandFont(); this.ladePreise(); this.ladeTrial(); },
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
    chf(rappen) {
      const v = (Number(rappen) || 0) / 100;
      return Number.isInteger(v) ? String(v) : v.toFixed(2);
    },
    // Fix-Runde 24.09.2026 (s6-B02): plan_prices ist oeffentlich lesbar (Policy
    // plan_prices_public_read, qual true), darum genuegt der Anon-Key. Ein Fehler hier
    // blockiert nichts: die Karte behaelt ihren Anzeigewert, der Bezugspreis fällt weg.
    // Nachbesserung 24.09.2026 (W1): dieselbe Abfrage wie abo-verwalten und stripe-checkout
    // «Trial prüfen». Policy subscriptions_select_own_or_admin, darum Filter auf die eigene
    // user_id Pflicht. Ohne user_id kein Aufruf (bleibt null).
    async ladeTrial() {
      const uid = this.userId;
      if (!this.baseUrl || !this.apiKey || !uid) { this.trialBerechtigt = null; return; }
      try {
        const res = await this.fetchWithTimeout(
          `${this.baseUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(uid)}&select=id&limit=1`,
          { headers: { ...this.authHeaders } },
          10000,
        );
        if (!res || !res.ok) {
          this.trialBerechtigt = null;
          try { console.warn(`[abo-auswahl] subscriptions nicht geladen (HTTP ${res && res.status})`); } catch (_) { /* ignore */ }
          return;
        }
        const rows = await res.json().catch(() => null);
        this.trialBerechtigt = Array.isArray(rows) ? rows.length === 0 : null;
      } catch (e) {
        this.trialBerechtigt = null;
        try { console.warn('[abo-auswahl] subscriptions nicht geladen'); } catch (_) { /* ignore */ }
      }
    },
    async ladePreise() {
      if (!this.baseUrl || !this.apiKey) return;
      try {
        const res = await this.fetchWithTimeout(
          `${this.baseUrl}/rest/v1/plan_prices?select=plan,interval,active,amount_rappen,stripe_price_id&plan=eq.basis`,
          { headers: { apikey: this.apiKey } },
          10000,
        );
        if (!res || !res.ok) {
          try { console.warn(`[abo-auswahl] plan_prices nicht geladen (HTTP ${res && res.status})`); } catch (_) { /* ignore */ }
          return;
        }
        const rows = await res.json().catch(() => null);
        this.preise = Array.isArray(rows)
          ? rows.filter(r => r && r.stripe_price_id && Number(r.amount_rappen) > 0)
          : [];
      } catch (e) {
        try { console.warn('[abo-auswahl] plan_prices nicht geladen'); } catch (_) { /* ignore */ }
      }
    },
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
      this.errorLink = false;
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
          // Nach-Audit 03.10.2026 ([82]): zwei Fehler sind keine «gleich nochmal»-Fehler.
          // 409 / ALREADY_SUBSCRIBED: ein Retry klappt nie, der Weg fuehrt in die Abo-Verwaltung.
          // 503: Server-Hickser (auch technische Texte wie STRIPE_NOT_CONFIGURED), darum ein
          // eigener fester Satz statt des Serverwortlauts.
          if (res.status === 409 || (data && data.code === 'ALREADY_SUBSCRIBED')) {
            this.errorMsg = 'Du hast schon ein Abo. Änderungen daran machst du in der Abo-Verwaltung.';
            this.errorLink = true;
          } else if (res.status === 503) {
            this.errorMsg = 'Das klappt gerade nicht. Versuche es in ein paar Minuten nochmals.';
          } else {
            this.errorMsg = 'Der Checkout konnte nicht gestartet werden. Versuche es gleich nochmal.';
          }
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
          this.errorMsg = 'Die Verbindung hat nicht geklappt. Prüfe dein Internet und versuche es nochmal.';
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

<style scoped>
/* ============================================================
   imploya — Design-Tokens, Stand Stil A «Editorial» (Entscheid 13.10.2026).
   Gekuerzter Auszug aus Coded-Components-Vorlage/design-tokens.css, nur was diese
   Komponente braucht. Tokens wie in meine-faelle (Pilot-Commit f760e23).
   ============================================================ */
:root, .hrk-root {
  --hrk-bordeaux:        #72323C;  /* nur Links/Namen, nie Knopf-Flaeche */
  --hrk-bordeaux-dark:   #5A2630;
  --hrk-bordeaux-soft:   #F1E7E9;
  --hrk-creme: #F7F5F1;
  --hrk-anthrazit: #241F1C;
  --hrk-gold:            #C3A359;  /* nur Linien */
  --hrk-gold-dark:       #A98A45;
  --hrk-surface:         #FFFFFF;
  --hrk-surface-muted: #F2EFEA;
  --hrk-border: #E2DDD5;
  --hrk-border-strong: #CFC8BD;
  --hrk-text: #241F1C;
  --hrk-text-muted:      #6B6357;
  --hrk-on-primary:     #FFFFFF;
  --hrk-danger:          #B23A48;  --hrk-danger-bg:  #F8E7E9;
  --hrk-font-head: "Archivo", "Inter", system-ui, sans-serif;
  --hrk-font-body: "Inter", "Source Sans 3", system-ui, sans-serif;
  --hrk-fs-h1: 1.875rem;
  --hrk-fs-h2: 1.375rem;
  --hrk-fs-body: 1.0625rem;
  --hrk-fs-small: 0.9375rem;
  --hrk-lh-body: 1.55;
  --hrk-fw-regular: 400; --hrk-fw-medium: 500; --hrk-fw-semibold: 600;
  --hrk-space-1: 4px;  --hrk-space-2: 8px;  --hrk-space-3: 12px;
  --hrk-space-4: 16px; --hrk-space-5: 24px; --hrk-space-6: 32px;
  --hrk-space-7: 48px;
  --hrk-tap-min: 44px;
  --hrk-page-max: 880px;
  --hrk-schiefer: #33475B;
  --hrk-schiefer-dark: #243444;
  --hrk-schiefer-soft: #EBEEF1;
  --hrk-font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  --hrk-font-brand: "Gloock", Georgia, serif;
  --hrk-fs-xs: 0.8125rem;
  --hrk-ls-caps: .06em;
  /* Stil A «Editorial»: Linien, Warmgrau, Hauchfarben, Archivo-Labels */
  --hrk-linie: #D6D0CA;
  --hrk-warmgrau: #EFEBE7;
  --hrk-gold-hauch: #FAF6EC;
  --hrk-schiefer-hauch: #F2F5F8;
  --hrk-blush-hauch: #FBF5F5;
  --hrk-font-label: "Archivo", "Inter", system-ui, sans-serif;
}

/* ---------------- Basis ---------------- */
.hrk-root, .hrk-root * { box-sizing: border-box; }
.hrk-root {
  width: 100%;
  font-family: var(--hrk-font-body);
  font-size: var(--hrk-fs-body);
  line-height: var(--hrk-lh-body);
  color: var(--hrk-text);
  background: var(--hrk-surface);
  -webkit-font-smoothing: antialiased;
}
.hrk-muted { color: var(--hrk-text-muted); }
.hrk-icon { width: 20px; height: 20px; flex: none; }
.hrk-icon--sm { width: 16px; height: 16px; }
.hrk-root a:focus-visible, .hrk-root button:focus-visible { outline: 2px solid var(--hrk-schiefer); outline-offset: 3px; border-radius: 3px; box-shadow: none; }

/* ============================================================
   Abo-Auswahl — Stil A «Editorial»: Linien statt Karte, Label-Spalte 220px + Inhalt,
   Gloock-Titel, Archivo-Labels, Text-Knopf mit Gold-Unterstrich (eine Hauptaktion).
   Farbrollen: Schiefer = Knoepfe/Struktur, Bordeaux = Link, Gold = nur Linie.
   ============================================================ */
.abo-root { font-family: var(--hrk-font-body); color: var(--hrk-text); }
.abo-main { display: block; width: 100%; }
.abo-wrap { max-width: 1120px; margin: 0 auto; padding-left: var(--hrk-space-5); padding-right: var(--hrk-space-5); }

.abo-top { background: var(--hrk-surface); padding: clamp(40px, 6vw, 64px) 0 clamp(28px, 4vw, 44px); }
.abo-lab, .abo-nr { font-family: var(--hrk-font-label); font-size: var(--hrk-fs-xs); font-weight: var(--hrk-fw-semibold); letter-spacing: .14em;
  text-transform: uppercase; color: var(--hrk-text-muted); }
.abo-lab { margin: 0 0 var(--hrk-space-3); }
.abo-h1 { font-family: var(--hrk-font-brand); font-weight: 400; letter-spacing: -.01em; color: var(--hrk-text);
  font-size: clamp(40px, 7.4vw, 88px); line-height: 1.02; margin: 0; overflow-wrap: anywhere; }
.abo-intro { margin: var(--hrk-space-4) 0 0; max-width: 40rem; }

/* Band: Warmgrau, Haarlinie oben, Raster Label-Spalte + Inhalt */
.abo-band { background: var(--hrk-warmgrau); border-top: 1px solid var(--hrk-linie); }
.abo-cards { display: block; padding-top: 28px; padding-bottom: 36px; }
.abo-card { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: var(--hrk-space-6); cursor: default; }
.abo-card__lab { min-width: 0; }
.abo-nr { display: block; margin-bottom: 6px; }
.abo-card__name { font-family: var(--hrk-font-brand); font-weight: 400; letter-spacing: -.01em; font-size: 26px; line-height: 1.15; margin: 0; color: var(--hrk-text); overflow-wrap: anywhere; }
.abo-card__body { min-width: 0; border-top: 1px solid var(--hrk-text); padding-top: var(--hrk-space-4); max-width: 640px; }

/* Toggle: Text-Reiter, aktiver Reiter Schiefer mit Haarlinie, kein Kasten */
.abo-toggle { display: flex; flex-wrap: wrap; gap: var(--hrk-space-1) var(--hrk-space-5); margin: 0 0 var(--hrk-space-4); }
.abo-toggle__btn {
  background: none; border: 0; border-bottom: 1px solid transparent; border-radius: 0;
  min-height: var(--hrk-tap-min); padding: 6px 0;
  font: inherit; font-size: var(--hrk-fs-small); font-weight: var(--hrk-fw-medium);
  color: var(--hrk-text-muted); cursor: pointer;
  display: inline-flex; align-items: center; gap: var(--hrk-space-2);
}
.abo-toggle__btn:hover { color: var(--hrk-text); }
.abo-toggle__btn--active { color: var(--hrk-schiefer); font-weight: var(--hrk-fw-semibold); border-bottom-color: var(--hrk-schiefer); }
.abo-toggle__save { font-family: var(--hrk-font-label); font-size: var(--hrk-fs-xs); font-weight: var(--hrk-fw-semibold); letter-spacing: .08em; text-transform: uppercase; color: var(--hrk-schiefer); }

.abo-card__price { display: flex; align-items: baseline; flex-wrap: wrap; gap: var(--hrk-space-2); }
.abo-card__amount { font-family: var(--hrk-font-brand); font-weight: 400; font-size: clamp(40px, 6vw, 56px); line-height: 1.05; letter-spacing: -.01em; color: var(--hrk-text); }
.abo-card__period { font-size: var(--hrk-fs-small); color: var(--hrk-text-muted); }
.abo-card__saving { font-size: var(--hrk-fs-small); color: var(--hrk-schiefer); font-weight: var(--hrk-fw-semibold); margin: var(--hrk-space-1) 0 0; }
.abo-card__tagline { font-size: var(--hrk-fs-body); color: var(--hrk-text-muted); margin: var(--hrk-space-3) 0 var(--hrk-space-4); }

/* Leistungen: Zeilen mit Haarlinien */
.abo-card__features { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--hrk-linie); font-size: var(--hrk-fs-body); }
.abo-card__features li { display: flex; align-items: flex-start; gap: var(--hrk-space-3); padding: var(--hrk-space-3) 0; border-bottom: 1px solid var(--hrk-linie); }
.abo-card__check { color: var(--hrk-schiefer); margin-top: 5px; }

/* Hauptaktion: Schiefer-Text mit 2px Gold-Unterstrich, kein Kasten */
.abo-actions { margin-top: var(--hrk-space-5); }
.abo-fw { display: inline-flex; align-items: center; gap: 10px; min-height: var(--hrk-tap-min); background: none; border: 0; border-bottom: 2px solid var(--hrk-gold);
  border-radius: 0; padding: 8px 0; font: 600 18px/1.3 var(--hrk-font-body); color: var(--hrk-schiefer); cursor: pointer; }
.abo-fw:hover { color: var(--hrk-schiefer-dark); }
.abo-fw .hrk-icon { transition: transform .15s; }
.abo-fw:hover .hrk-icon { transform: translateX(3px); }
.abo-fw[disabled] { opacity: .5; cursor: not-allowed; }

/* Extras-Hinweis */
.abo-hint-extra { font-size: var(--hrk-fs-small); color: var(--hrk-text-muted); margin: var(--hrk-space-4) 0 0; }

/* Fehler: Blush-Hauch, Linie links in Danger */
.abo-error { margin: var(--hrk-space-4) 0 0; padding: var(--hrk-space-3) var(--hrk-space-4); background: var(--hrk-blush-hauch); border-left: 2px solid var(--hrk-danger);
  border-radius: 0 4px 4px 0; color: var(--hrk-danger); font-size: var(--hrk-fs-small); }
.abo-error__link { margin-left: .25em; color: var(--hrk-bordeaux); font-weight: var(--hrk-fw-semibold); text-decoration: underline; text-underline-offset: 2px; }
.abo-error__link:hover { color: var(--hrk-bordeaux-dark); }

/* Später: Zweitweg, grauer Text mit Haarlinie */
.abo-later { padding-top: var(--hrk-space-5); padding-bottom: clamp(40px, 6vw, 64px); }
.abo-later__btn {
  display: inline-flex; align-items: center; min-height: var(--hrk-tap-min);
  background: none; border: 0; border-bottom: 1px solid var(--hrk-linie); border-radius: 0; padding: 6px 0; cursor: pointer;
  font: 500 var(--hrk-fs-small)/1.3 var(--hrk-font-body); color: var(--hrk-text-muted);
}
.abo-later__btn:hover { color: var(--hrk-text); border-bottom-color: var(--hrk-text-muted); }
.abo-later__btn:disabled { opacity: .5; cursor: not-allowed; }

@media (max-width: 860px) {
  .abo-card { grid-template-columns: minmax(0, 1fr); gap: var(--hrk-space-4); }
  .abo-card__name { font-size: 24px; }
}
@media (max-width: 600px) {
  .abo-wrap { padding-left: var(--hrk-space-4); padding-right: var(--hrk-space-4); }
}
</style>
