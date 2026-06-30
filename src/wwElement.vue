<template>
  <div class="hrk-root abo-root">
    <main class="abo-page hrk-page">

      <!-- Header -->
      <div class="abo-header">
        <h1 class="hrk-h1">Wähle dein Imploya-Abo</h1>
        <p class="hrk-muted">Erster Monat gratis — keine Kreditkarte nötig, jederzeit kündbar.</p>

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
        <div class="abo-card" :class="{ 'abo-card--selected': selected === 'basis' }" @click="selectPlan('basis')">
          <div class="abo-card__badge" style="visibility:hidden">—</div>
          <h2 class="abo-card__name">Basis</h2>
          <div class="abo-card__price">
            <span class="abo-card__amount">CHF {{ billing === 'year' ? '290' : '29' }}</span>
            <span class="abo-card__period">{{ billing === 'year' ? '/Jahr' : '/Monat' }}</span>
          </div>
          <p v-if="billing === 'year'" class="abo-card__saving">statt CHF 348/Jahr — 2 Monate gratis</p>
          <p class="abo-card__tagline">Für den Einstieg und kleinere Betriebe.</p>
          <ul class="abo-card__features">
            <li>✓ Emily — 10 Fragen/Woche</li>
            <li>✓ 10 Dokumente/Monat</li>
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
        <div class="abo-card abo-card--highlight" :class="{ 'abo-card--selected': selected === 'plus' }" @click="selectPlan('plus')">
          <div class="abo-card__badge">Empfohlen</div>
          <h2 class="abo-card__name">Plus</h2>
          <div class="abo-card__price">
            <span class="abo-card__amount">CHF {{ billing === 'year' ? '590' : '59' }}</span>
            <span class="abo-card__period">{{ billing === 'year' ? '/Jahr' : '/Monat' }}</span>
          </div>
          <p v-if="billing === 'year'" class="abo-card__saving">statt CHF 708/Jahr — 2 Monate gratis</p>
          <p class="abo-card__tagline">Für Betriebe mit mehr HR-Bedarf.</p>
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
        <button class="abo-later__btn" :disabled="busy" @click="skipForNow">Später entscheiden — ich schau mich erst um</button>
        <p class="hrk-hint">Du kannst das Abo jederzeit in den Einstellungen aktivieren.</p>
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
      let url = (this.content && this.content.supabaseUrl) || 'https://ztvqsxdudzdyqgeylujr.supabase.co';
      if (/nemxnflngcfrpamkuesm/.test(String(url))) url = 'https://ztvqsxdudzdyqgeylujr.supabase.co';
      return String(url).replace(/\/+$/, '');
    },
    apiKey() { return (this.content && this.content.apiKey) || 'sb_publishable_4rsRb_VB3l_45JO7sw0VSA_ODDS4CZc'; },
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
          this.errorMsg = (data && (data.error || data.message)) || 'Checkout konnte nicht gestartet werden.';
          this.emitEvent('error', { reason: 'checkout', status: res.status });
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

<style scoped>
.abo-root { font-family: inherit; color: inherit; }
.abo-page { max-width: 800px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }

/* Header */
.abo-header { text-align: center; margin-bottom: 2.5rem; }

/* Toggle */
.abo-toggle {
  display: inline-flex;
  background: var(--hrk-color-bg, #f9fafb);
  border: 1.5px solid var(--hrk-color-border, #e5e7eb);
  border-radius: 999px;
  padding: 0.25rem;
  margin-top: 1.25rem;
  gap: 0.25rem;
}
.abo-toggle__btn {
  background: none;
  border: none;
  border-radius: 999px;
  padding: 0.4rem 1.1rem;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--hrk-color-muted, #6b7280);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s, color 0.15s;
}
.abo-toggle__btn--active {
  background: var(--hrk-color-surface, #fff);
  color: var(--hrk-color-text, #1f2937);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.abo-toggle__save {
  font-size: 0.7rem;
  font-weight: 700;
  background: color-mix(in srgb, var(--hrk-color-primary, #7c3149) 12%, transparent);
  color: var(--hrk-color-primary, #7c3149);
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
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

/* Karte */
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
.abo-card__saving { font-size: 0.78rem; color: var(--hrk-color-primary, #7c3149); font-weight: 600; margin: -0.25rem 0 0; }
.abo-card__tagline { font-size: 0.875rem; color: var(--hrk-color-muted, #6b7280); margin: 0; }

.abo-card__features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem; }
.abo-card__feat--dim { color: var(--hrk-color-muted, #9ca3af); }
.abo-card__cta { width: 100%; margin-top: 0.5rem; }

/* Extras-Hinweis */
.abo-hint-extra { text-align: center; font-size: 0.82rem; color: var(--hrk-color-muted, #6b7280); margin-top: 1.25rem; }

/* Fehler */
.abo-error { color: var(--hrk-danger); font-size: 0.9rem; text-align: center; margin-top: 1rem; }

/* Später */
.abo-later { text-align: center; margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.abo-later__btn {
  background: none; border: none; cursor: pointer;
  color: var(--hrk-color-muted, #6b7280); font-size: 0.9rem;
  text-decoration: underline; padding: 0.25rem 0.5rem;
}
.abo-later__btn:hover { color: var(--hrk-color-text, #1f2937); }
.abo-later__btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
