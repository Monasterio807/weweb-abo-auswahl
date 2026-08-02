// =============================================================================
// wwElement.test.js — weweb-abo-auswahl (Testabdeckung Phase 2b)
// v4 (02.08.2026): Ein-Plan-Modell (Plus eingestellt) — Tests auf die eine
// verbleibende Karte (Basis / «Imploya») umgestellt: Preis, Monats/Jahres-
// Toggle mit exakter Preislogik (290/«2 Monate gratis»), Auswahl-Zustand,
// Stripe-Checkout (Payload mit korrekter price_id, Header, Events,
// Fehlerpfade) und Design-System-Regression (.hrk-*-Klassen).
//
// Hinweis: startCheckout() setzt bei Erfolg window.location.href — jsdom
// meldet dafuer «Not implemented: navigation» als Log-Rauschen, der Test
// selbst bleibt davon unberuehrt (Assertions laufen vor der Umleitung).
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import wwElement from './wwElement.vue';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// Stripe Price-IDs exakt wie in wwElement.vue (data.priceIds)
const PRICE_IDS = {
  basis_month: 'price_1TnxRXFLoauOOkHyLbCG9e4j',
  basis_year: 'price_1TnxRXFLoauOOkHyGTdJU7TP',
};

function mountComponent(contentOverrides = {}) {
  return mount(wwElement, {
    props: {
      content: {
        authToken: '',
        apiKey: 'test-anon-key',
        ...contentOverrides,
      },
      uid: 'test',
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Ein-Plan-Modell: genau eine Karte mit Namen, Preis und Features', () => {
  it('rendert genau eine Karte: Imploya (CHF 29/Monat)', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.abo-card');
    expect(cards.length).toBe(1);

    const basis = cards[0];
    expect(basis.find('.abo-card__name').text()).toBe('Imploya');
    expect(basis.find('.abo-card__amount').text()).toBe('CHF 29');
    expect(basis.find('.abo-card__period').text()).toBe('/Monat');

    expect(basis.text()).toContain('Emily — 30 Fragen/Monat');
    expect(basis.text()).toContain('15 Dokumente/Monat');
    // Kein Vergleich mehr noetig, keine ausgegrauten Zeilen
    expect(basis.findAll('.abo-card__feat--dim').length).toBe(0);
  });

  it('Jahres-Toggle: Preis wechselt auf CHF 290 pro Jahr inkl. Sparhinweis', async () => {
    const wrapper = mountComponent();
    // Monatlich ist der Default, kein Sparhinweis sichtbar
    expect(wrapper.vm.billing).toBe('month');
    expect(wrapper.findAll('.abo-card__saving').length).toBe(0);

    // Klick auf «Jährlich» (zweiter Toggle-Button)
    await wrapper.findAll('.abo-toggle__btn')[1].trigger('click');
    expect(wrapper.vm.billing).toBe('year');

    const amounts = wrapper.findAll('.abo-card__amount').map((n) => n.text());
    expect(amounts).toEqual(['CHF 290']);
    const periods = wrapper.findAll('.abo-card__period').map((n) => n.text());
    expect(periods).toEqual(['/Jahr']);
    // Exakte Ersparnis-Logik: 12×29=348, 2 Monate gratis
    const savings = wrapper.findAll('.abo-card__saving').map((n) => n.text());
    expect(savings[0]).toBe('statt CHF 348/Jahr — 2 Monate gratis');
  });
});

describe('Auswahl-Logik', () => {
  it('Klick auf die Karte setzt selected und markiert sie mit .abo-card--selected', async () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.abo-card');
    expect(cards[0].classes()).toContain('abo-card--selected');
    await cards[0].trigger('click');
    expect(wrapper.vm.selected).toBe('basis');
    expect(cards[0].classes()).toContain('abo-card--selected');
  });
});

describe('Stripe-Checkout', () => {
  it('CTA «Jetzt starten» (jaehrlich): ruft stripe-checkout mit korrekter price_id, Headern und feuert checkout-started', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://checkout.stripe.com/test-session' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountComponent({ authToken: 'test-jwt', supabaseUrl: 'https://ztvqsxdudzdyqgeylujr.supabase.co' });
    await wrapper.findAll('.abo-toggle__btn')[1].trigger('click'); // Jährlich
    await wrapper.find('.abo-card__cta').trigger('click');
    await flush();

    const call = fetchMock.mock.calls.find(([u]) => String(u).includes('/functions/v1/stripe-checkout'));
    expect(call).toBeTruthy();
    // Supabase-URL (Zuerich) kommt aus der supabaseUrl-Property (Default liegt in ww-config.js)
    expect(String(call[0])).toBe('https://ztvqsxdudzdyqgeylujr.supabase.co/functions/v1/stripe-checkout');
    // Header: Anon-Key + Bearer-JWT
    expect(call[1].headers.apikey).toBe('test-anon-key');
    expect(call[1].headers.Authorization).toBe('Bearer test-jwt');
    // Payload: exakt die Basis-Jahres-Price-ID + Return-URLs
    const body = JSON.parse(call[1].body);
    expect(body.price_id).toBe(PRICE_IDS.basis_year);
    expect(body.success_url).toBe('http://localhost/onboarding?checkout=success');
    expect(body.cancel_url).toBe('http://localhost/');

    // WeWeb-Event checkout-started mit Plan + Abrechnungsart
    const events = wrapper.emitted('trigger-event') || [];
    const started = events.map(([e]) => e).find((e) => e.name === 'checkout-started');
    expect(started).toBeTruthy();
    expect(started.event).toEqual({ plan: 'basis', billing: 'year' });
  });

  it('CTA «Jetzt starten» (monatlich): sendet die Basis-Monats-Price-ID', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://checkout.stripe.com/test-session' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountComponent({ authToken: 'test-jwt' });
    await wrapper.find('.abo-card__cta').trigger('click');
    await flush();

    const call = fetchMock.mock.calls.find(([u]) => String(u).includes('/functions/v1/stripe-checkout'));
    const body = JSON.parse(call[1].body);
    expect(body.price_id).toBe(PRICE_IDS.basis_month);
    expect(wrapper.vm.selected).toBe('basis');
  });

  it('ohne Login: kein Backend-Aufruf, freundliche Fehlermeldung', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountComponent({ authToken: '' });
    await wrapper.find('.abo-card__cta').trigger('click');
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(wrapper.vm.errorMsg).toBe('Du bist nicht eingeloggt. Bitte melde dich an.');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.abo-error').text()).toBe('Du bist nicht eingeloggt. Bitte melde dich an.');
  });

  it('Backend-Fehler: zeigt die Server-Meldung, feuert error-Event, keine Umleitung, busy wird zurueckgesetzt', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Preis nicht gefunden.' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountComponent({ authToken: 'test-jwt' });
    await wrapper.find('.abo-card__cta').trigger('click');
    await flush();

    expect(wrapper.vm.errorMsg).toBe('Der Checkout konnte nicht gestartet werden. Versuch es gleich nochmal.');
    expect(wrapper.vm.busy).toBe(false);
    const events = (wrapper.emitted('trigger-event') || []).map(([e]) => e);
    const errorEvent = events.find((e) => e.name === 'error');
    expect(errorEvent).toBeTruthy();
    expect(errorEvent.event.reason).toBe('checkout');
    // Seite bleibt, wo sie ist (keine Stripe-URL)
    expect(window.location.href).toBe('http://localhost/');
  });

  it('«Noch nicht»-Link feuert das skipped-Event', async () => {
    const wrapper = mountComponent();
    await wrapper.find('.abo-later__btn').trigger('click');
    const events = (wrapper.emitted('trigger-event') || []).map(([e]) => e);
    expect(events.find((e) => e.name === 'skipped')).toBeTruthy();
  });
});

describe('Design-System-Regression (.hrk-* Tokens/Klassen)', () => {
  it('Grundgeruest nutzt .hrk-root/.hrk-page/.hrk-card, CTA ist .hrk-btn--primary', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.hrk-root').exists()).toBe(true);
    expect(wrapper.find('.hrk-page').exists()).toBe(true);
    expect(wrapper.find('.hrk-h1').text()).toBe('Wähle dein Imploya-Abo');
    // Eine Plan-Karte baut auf .hrk-card auf
    expect(wrapper.findAll('.hrk-card').length).toBe(1);
    // Design-Regel: genau EIN .hrk-btn--primary pro Seite
    expect(wrapper.findAll('.hrk-btn--primary').length).toBe(1);
    expect(wrapper.findAll('.hrk-btn--secondary').length).toBe(0);
    expect(wrapper.find('.abo-card__cta').classes()).toContain('hrk-btn');
  });
});
