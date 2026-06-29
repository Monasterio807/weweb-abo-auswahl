<template>
  <div class="hrk-root abo-root">
    <main class="abo-page hrk-page">

      <!-- Header -->
      <div class="abo-header">
        <h1 class="hrk-h1">Wähle dein Imploya-Abo</h1>
        <p class="hrk-muted">Starte noch heute — keine Kreditkarte nötig, jederzeit kündbar.</p>
      </div>

      <!-- Plan-Karten -->
      <div class="abo-cards">

        <!-- BASIS -->
        <div class="abo-card" :class="{ 'abo-card--selected': selected === 'basis' }" @click="selectPlan('basis')">
          <div class="abo-card__badge" style="visibility:hidden">Beliebt</div>
          <h2 class="abo-card__name">Basis</h2>
          <div class="abo-card__price">
            <span class="abo-card__amount">CHF 39</span>
            <span class="abo-card__period">/Monat</span>
          </div>
          <p class="abo-card__tagline">Perfekt für Kleinbetriebe und den Einstieg.</p>
          <ul class="abo-card__features">
            <li>✓ Emily — deine HR-Assistentin</li>
            <li>✓ 20 Emily-Fragen pro Woche</li>
            <li>✓ 5 Dokumente pro Monat</li>
            <li>✓ 1 HR-Prüfung pro Monat</li>
            <li>✓ Vertrag, Zeugnis, Kündigung</li>
            <li class="abo-card__feat--dim">— Beratungsgespräch</li>
          </ul>
          <button
            class="hrk-btn hrk-btn--primary abo-card__cta"
            :disabled="busy"
            @click.stop="startCheckout('basis')"
          >{{ busy && selected === 'basis' ? 'Einen Moment …' : 'Basis starten' }}</button>
        </div>

        <!-- KOMFORT -->
        <div class="abo-card abo-card--highlight" :class="{ 'abo-card--selected': selected === 'komfort' }" @click="selectPlan('komfort')">
          <div class="abo-card__badge">Beliebt</div>
          <h2 class="abo-card__name">Komfort</h2>
          <div class="abo-card__price">
            <span class="abo-card__amount">CHF 69</span>
            <span class="abo-card__period">/Monat</span>
          </div>
          <p class="abo-card__tagline">Für wachsende Betriebe mit mehr HR-Bedarf.</p>
          <ul class="abo-card__features">
            <li>✓ Emily — deine HR-Assistentin</li>
            <li>✓ 50 Emily-Fragen pro Woche</li>
            <li>✓ 15 Dokumente pro Monat</li>
            <li>✓ 3 HR-Prüfungen pro Monat</li>
            <li>✓ Vertrag, Zeugnis, Kündigung</li>
            <li>✓ 1 Beratungsgespräch/Monat (15 Min)</li>
          </ul>

          <!-- MA-Grösse Auswahl (nur bei Komfort) -->
          <div class="abo-ma-picker" @click.stop>
            <p class="hrk-label abo-ma-picker__label">Betriebsgrösse</p>
            <div class="abo-ma-picker__options">
              <label class="abo-ma-opt" :class="{ 'abo-ma-opt--active': komfortSize === 's' }">
                <input type="radio" name="komfort-size" value="s" v-model="komfortSize" /> bis 15 MA
              </label>
              <label class="abo-ma-opt" :class="{ 'abo-ma-opt--active': komfortSize === 'l' }">
                <input type="radio" name="komfort-size" value="l" v-model="komfortSize" /> ab 16 MA
              </label>
            </div>
          </div>

          <button
            class="hrk-btn hrk-btn--primary abo-card__cta"
            :disabled="busy"
            @click.stop="startCheckout('komfort')"
          >{{ busy && selected === 'komfort' ? 'Einen Moment …' : 'Komfort starten' }}</button>
        </div>

        <!-- SELBST BAUEN -->
        <div class="abo-card abo-card--custom" :class="{ 'abo-card--selected': selected === 'custom', 'abo-card--open': customOpen }">
          <div class="abo-card__badge" style="visibility:hidden">—</div>
          <h2 class="abo-card__name">Selbst bauen</h2>
          <div class="abo-card__price">
            <span class="abo-card__amount">ab CHF 39</span>
          </div>
          <p class="abo-card__tagline">Beantworte 3 Fragen — wir empfehlen dir das passende Abo.</p>

          <button
            v-if="!customOpen"
            class="hrk-btn hrk-btn--secondary abo-card__cta"
            @click.stop="openCustom"
          >Konfigurator öffnen</button>

          <!-- Konfigurator -->
          <div v-else class="abo-config" @click.stop>
            <div class="abo-config__step">
              <p class="abo-config__q">Wie viele Mitarbeitende hat dein Betrieb?</p>
              <div class="abo-config__opts">
                <button
                  v-for="opt in maOpts"
                  :key="opt.value"
                  class="abo-config__btn"
                  :class="{ 'abo-config__btn--active': cfg.ma === opt.value }"
                  @click="cfg.ma = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="abo-config__step">
              <p class="abo-config__q">Wie oft brauchst du HR-Unterstützung?</p>
              <div class="abo-config__opts">
                <button class="abo-config__btn" :class="{ 'abo-config__btn--active': cfg.freq === 'gelegentlich' }" @click="cfg.freq = 'gelegentlich'">Gelegentlich</button>
                <button class="abo-config__btn" :class="{ 'abo-config__btn--active': cfg.freq === 'regelmaessig' }" @click="cfg.freq = 'regelmaessig'">Regelmässig</button>
              </div>
            </div>
            <div class="abo-config__step">
              <p class="abo-config__q">Wie viele Dokumente brauchst du pro Monat?</p>
              <div class="abo-config__opts">
                <button class="abo-config__btn" :class="{ 'abo-config__btn--active': cfg.docs === 'wenig' }" @click="cfg.docs = 'wenig'">Wenige (1–5)</button>
                <button class="abo-config__btn" :class="{ 'abo-config__btn--active': cfg.docs === 'mehr' }" @click="cfg.docs = 'mehr'">Mehr (6–15)</button>
              </div>
            </div>

            <!-- Empfehlung -->
            <div v-if="recommendation" class="abo-recommendation">
              <p class="abo-rec__label">Wir empfehlen dir:</p>
              <p class="abo-rec__plan">{{ recommendation === 'basis' ? '🟢 Basis — CHF 39/Monat' : '🔵 Komfort — CHF 69/Monat' }}</p>
              <p v-if="recommendation === 'komfort'" class="hrk-hint" style="margin-top:0.25rem">
                Betriebsgrösse: {{ komfortSize === 'l' ? 'ab 16 MA' : 'bis 15 MA' }}
              </p>
              <button
                class="hrk-btn hrk-btn--primary"
                style="margin-top:0.75rem;width:100%"
                :disabled="busy"
                @click="startCheckout(recommendation)"
              >{{ busy ? 'Einen Moment …' : (recommendation === 'basis' ? 'Basis starten' : 'Komfort starten') }}</button>
            </div>
            <p v-else class="hrk-hint" style="margin-top:0.75rem">Beantworte alle 3 Fragen für die Empfehlung.</p>
          </div>
        </div>

      </div>

      <!-- Fehler -->
      <p v-if="errorMsg" class="abo-error" role="alert">{{ errorMsg }}</p>

      <!-- Später entscheiden -->
      <div class="abo-later">
        <button class="abo-later__btn" :disabled="busy" @click="skipForNow">Später entscheiden — ich schau mich erst um</button>
        <p class="hrk-hint">Du kannst das Abo jederzeit in den Einstellungen aktivieren. Bis dahin stehen dir alle Grundfunktionen zur Verfügung.</p>
      </div>

    </main>
  </div>
</template>

<script>
/**
 * WeWeb Coded Component — «Abo-Auswahl»
 * Zeigt Basis / Komfort / Selbst-bauen-Konfigurator.
 * Auf «Jetzt starten» → stripe-checkout Edge Function → Stripe.
 * «Später entscheiden» → direkt zum Onboarding.
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
      selected: null,
      komfortSize: 's',
      customOpen: false,
      cfg: { ma: null, freq: null, docs: null },
      busy: false,
      errorMsg: '',
      maOpts: [
        { value: '1-5', label: '1–5 MA' },
        { value: '6-15', label: '6–15 MA' },
        { value: '16+', label: '16+ MA' },
      ],
      // Stripe Price-IDs aus plan_prices (Monatlich)
      priceIds: {
        basis:      'price_1ThqFTFLoauOOkHy0GLy0aWZ',
        komfort_s:  'price_1ThqFVFLoauOOkHyZnZCmd4U',
        komfort_l:  'price_1ThqFWFLoauOOkHypm0jLpK2',
      },
    };
  },
  computed: {
    baseUrl() {
      let url = (this.content && this.content.supabaseUrl) || 'https://ztvqsxdudzdyqgeylujr.supabase.co';
      if (/nemxnflngcfrpamkuesm/.test(String(url))) url = 'https://ztvqsxdudzdyqgeylujr.supabase.co';
      return String(url).replace(/\/+$/, '');
    },
    apiKey() { return (this.content && this.content.apiKey) || 'sb_publishable_4rsRb_VB3l_45JO7sw0VSA_ODDS4CZc'; },
    authToken() { return ((this.content && this.content.authToken) || '').toString(); },
    authHeaders() {
      const bearer = this.authToken.startsWith('Bearer ') ? this.authToken : `Bearer ${this.authToken}`;
      return { apikey: this.apiKey, Authorization: bearer };
    },
    onboardingUrl() { return ((this.content && this.content.onboardingUrl) || '/onboarding').toString(); },
    checkoutReturnUrl() { return ((this.content && this.content.checkoutReturnUrl) || '/onboarding').toString(); },
    recommendation() {
      if (!this.cfg.ma || !this.cfg.freq || !this.cfg.docs) return null;
      // Komfort wenn: viele MA oder häufig oder viele Docs
      const needsKomfort = this.cfg.ma === '6-15' || this.cfg.ma === '16+' || this.cfg.freq === 'regelmaessig' || this.cfg.docs === 'mehr';
      if (needsKomfort && this.cfg.ma === '16+') this.komfortSize = 'l';
      return needsKomfort ? 'komfort' : 'basis';
    },
  },
  methods: {
    emitEvent(name, payload) { this.$emit('trigger-event', { name, event: payload || {} }); },
    selectPlan(plan) { this.selected = plan; },
    openCustom() { this.customOpen = true; this.selected = 'custom'; },

    async startCheckout(planKey) {
      this.errorMsg = '';
      if (!this.authToken) { this.errorMsg = 'Du bist nicht eingeloggt. Bitte melde dich an.'; return; }
      // Preis-ID bestimmen
      let priceId;
      if (planKey === 'basis') {
        priceId = this.priceIds.basis;
      } else if (planKey === 'komfort') {
        priceId = this.komfortSize === 'l' ? this.priceIds.komfort_l : this.priceIds.komfort_s;
      } else { return; }

      this.busy = true;
      this.selected = planKey;
      this.emitEvent('checkout-started', { plan: planKey });
      try {
        const res = await fetch(`${this.baseUrl}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price_id: priceId,
            success_url: (typeof window !== 'undefined' ? window.location.origin : '') + this.checkoutReturnUrl + '?checkout=success',
            cancel_url: (typeof window !== 'undefined' ? window.location.href : ''),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          const msg = (data && (data.error || data.message)) ? data.error || data.message : 'Checkout konnte nicht gestartet werden.';
          this.errorMsg = msg;
          this.emitEvent('error', { reason: 'checkout', status: res.status });
          return;
        }
        // Stripe-URL aufrufen
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

<style scoped>
/* ── Root ── */
.abo-root { font-family: inherit; color: inherit; }
.abo-page { max-width: 1040px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }

/* ── Header ── */
.abo-header { text-align: center; margin-bottom: 2.5rem; }

/* ── Karten-Grid ── */
.abo-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 768px) {
  .abo-cards { grid-template-columns: 1fr; }
}

/* ── Karte ── */
.abo-card {
  background: var(--hrk-color-surface, #fff);
  border: 2px solid var(--hrk-color-border, #e5e7eb);
  border-radius: var(--hrk-radius-lg, 1rem);
  padding: 1.75rem 1.5rem;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.abo-card:hover { border-color: var(--hrk-color-primary, #7c3149); }
.abo-card--selected { border-color: var(--hrk-color-primary, #7c3149); box-shadow: 0 0 0 3px color-mix(in srgb, var(--hrk-color-primary, #7c3149) 15%, transparent); }
.abo-card--highlight {
  border-color: var(--hrk-color-primary, #7c3149);
  background: color-mix(in srgb, var(--hrk-color-primary, #7c3149) 4%, var(--hrk-color-surface, #fff));
}
.abo-card--custom { cursor: default; }

/* Badge */
.abo-card__badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--hrk-color-primary, #7c3149);
  background: color-mix(in srgb, var(--hrk-color-primary, #7c3149) 12%, transparent);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  align-self: flex-start;
}

.abo-card__name { font-size: 1.35rem; font-weight: 700; margin: 0; }
.abo-card__price { display: flex; align-items: baseline; gap: 0.25rem; }
.abo-card__amount { font-size: 2rem; font-weight: 800; }
.abo-card__period { font-size: 0.9rem; color: var(--hrk-color-muted, #6b7280); }
.abo-card__tagline { font-size: 0.875rem; color: var(--hrk-color-muted, #6b7280); margin: 0; }

.abo-card__features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem; }
.abo-card__feat--dim { color: var(--hrk-color-muted, #9ca3af); }

.abo-card__cta { width: 100%; margin-top: 0.5rem; }

/* MA-Picker */
.abo-ma-picker { padding: 0.75rem; background: color-mix(in srgb, var(--hrk-color-primary, #7c3149) 6%, transparent); border-radius: var(--hrk-radius, 0.5rem); }
.abo-ma-picker__label { font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--hrk-color-muted, #6b7280); }
.abo-ma-picker__options { display: flex; gap: 0.5rem; }
.abo-ma-opt {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1.5px solid var(--hrk-color-border, #e5e7eb);
  border-radius: var(--hrk-radius, 0.5rem);
  font-size: 0.85rem;
  cursor: pointer;
  text-align: center;
  background: var(--hrk-color-surface, #fff);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.abo-ma-opt input { display: none; }
.abo-ma-opt--active { border-color: var(--hrk-color-primary, #7c3149); background: color-mix(in srgb, var(--hrk-color-primary, #7c3149) 10%, transparent); font-weight: 600; }

/* Konfigurator */
.abo-config { display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem; }
.abo-config__step { display: flex; flex-direction: column; gap: 0.5rem; }
.abo-config__q { font-size: 0.9rem; font-weight: 600; margin: 0; }
.abo-config__opts { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.abo-config__btn {
  padding: 0.35rem 0.75rem;
  border: 1.5px solid var(--hrk-color-border, #e5e7eb);
  border-radius: var(--hrk-radius, 0.5rem);
  font-size: 0.85rem;
  cursor: pointer;
  background: var(--hrk-color-surface, #fff);
  transition: border-color 0.1s;
}
.abo-config__btn--active { border-color: var(--hrk-color-primary, #7c3149); background: color-mix(in srgb, var(--hrk-color-primary, #7c3149) 10%, transparent); font-weight: 600; }

.abo-recommendation { background: color-mix(in srgb, var(--hrk-color-primary, #7c3149) 8%, transparent); border-radius: var(--hrk-radius, 0.5rem); padding: 1rem; }
.abo-rec__label { font-size: 0.8rem; color: var(--hrk-color-muted, #6b7280); margin: 0 0 0.25rem; }
.abo-rec__plan { font-size: 1.1rem; font-weight: 700; margin: 0; }

/* Fehler */
.abo-error { color: var(--hrk-danger); font-size: 0.9rem; text-align: center; margin-top: 1rem; }

/* Später */
.abo-later { text-align: center; margin-top: 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.abo-later__btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--hrk-color-muted, #6b7280);
  font-size: 0.9rem;
  text-decoration: underline;
  padding: 0.25rem 0.5rem;
}
.abo-later__btn:hover { color: var(--hrk-color-text, #1f2937); }
.abo-later__btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
