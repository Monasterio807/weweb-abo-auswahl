// =============================================================================
// wwElement.test.js — weweb-abo-auswahl (Testabdeckung Phase 2b)
// Fokus: Plan-Karten (Basis CHF 29 / Plus CHF 59), Monats/Jahres-Toggle mit
// exakter Preislogik (290/590, «2 Monate gratis»), Auswahl-Zustand,
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
  plus_month: 'price_1TnxTOFLoauOOkHyOdAJo7vj',
  plus_year: 'price_1TnxTOFLoauOOkHyWUnmsk4z',
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

describe('Plan-Vergleich: beide Plaene mit Namen, Preisen und Features', () => {
  it('rendert genau zwei Karten: Basis (CHF 29/Monat) und Plus (CHF 59/Monat)', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.abo-card');
    expect(cards.length).toBe(2);

    const [basis, plus] = cards;
    expect(basis.find('.abo-card__name').text()).toBe('Basis');
    expect(basis.find('.abo-card__amount').text()).toBe('CHF 29');
    expect(basis.find('.abo-card__period').text()).toBe('/Monat');

    expect(plus.find('.abo-card__name').text()).toBe('Plus');
    expect(plus.find('.abo-card__amount').text()).toBe('CHF 59');
    expect(plus.find('.abo-card__period').text()).toBe('/Monat');

    // Kern-Features je Plan (Limits unterscheiden sich)
    expect(basis.text()).toContain('Emily — 10 Fragen/Woche');
    expect(basis.text()).toContain('10 Dokumente/Monat');
    expect(plus.text()).toContain('Emily — 30 Fragen/Woche');
    expect(plus.text()).toContain('25 Dokumente/Monat');
    // Basis hat Offboarding/Saison-Kit/Onboarding nur ausgegraut (— statt ✓)
    expect(basis.findAll('.abo-card__feat--dim').length).toBe(3);
    expect(plus.findAll('.abo-card__feat--dim').length).toBe(0);

    // Nur Plus traegt die sichtbare «Empfohlen»-Hervorhebung
    expect(plus.classes()).toContain('abo-card--highlight');
    expect(basis.classes()).not.toContain('abo-card--highlight');
    expect(plus.find('.abo-card__badge').text()).toBe('Empfohlen');
  });

  it('Jahres-Toggle: Preise wechseln auf CHF 290/590 pro Jahr inkl. Sparhinweis', async () => {
    const wrapper = mountComponent();
    // Monatlich ist der Default, kein Sparhinweis sichtbar
    expect(wrapper.vm.billing).toBe('month');
    expect(wrapper.findAll('.abo-card__saving').length).toBe(0);

    // Klick auf «Jährlich» (zweiter Toggle-Button)
    await wrapper.findAll('.abo-toggle__btn')[1].trigger('click');
    expect(wrapper.vm.billing).toBe('year');

    const amounts = wrapper.findAll('.abo-card__amount').map((n) => n.text());
    expect(amounts).toEqual(['CHF 290', 'CHF 590']);
    const periods = wrapper.findAll('.abo-card__period').map((n) => n.text());
    expect(periods).toEqual(['/Jahr', '/Jahr']);
    // Exakte Ersparnis-Logik: 12×29=348 bzw. 12×59=708, 2 Monate gratis
    const savings = wrapper.findAll('.abo-card__saving').map((n) => n.text());
    expect(savings[0]).toBe('statt CHF 348/Jahr — 2 Monate gratis');
    expect(savings[1]).toBe('statt CHF 708/Jahr — 2 Monate gratis');
  });
});

describe('Auswahl-Logik', () => {
  it('Klick auf eine Karte setzt selected und markiert sie mit .abo-card--selected', async () => {
    const wrapper = mountComponent();
    expect(wrapper.vm.selected).toBe(null);
    const cards = wrapper.findAll('.abo-card');
    await cards[0].trigger('click');
    expect(wrapper.vm.selected).toBe('basis');
    expect(cards[0].classes()).toContain('abo-card--selected');
    expect(cards[1].classes()).not.toContain('abo-card--selected');
    await cards[1].trigger('click');
    expect(wrapper.vm.selected).toBe('plus');
    expect(cards[1].classes()).toContain('abo-card--selected');
  });
});

describe('Stripe-Checkout', () => {
  it('CTA «Plus starten» (jaehrlich): ruft stripe-checkout mit korrekter price_id, Headern und feuert checkout-started', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://checkout.stripe.com/test-session' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountComponent({ authToken: 'test-jwt' });
    await wrapper.findAll('.abo-toggle__btn')[1].trigger('click'); // Jährlich
    await wrapper.findAll('.abo-card__cta')[1].trigger('click'); // Plus starten
    await flush();

    const call = fetchMock.mock.calls.find(([u]) => String(u).includes('/functions/v1/stripe-checkout'));
    expect(call).toBeTruthy();
    // Standard-Supabase-URL (Zuerich) als Default
    expect(String(call[0])).toBe('https://ztvqsxdudzdyqgeylujr.supabase.co/functions/v1/stripe-checkout');
    // Header: Anon-Key + Bearer-JWT
    expect(call[1].headers.apikey).toBe('test-anon-key');
    expect(call[1].headers.Authorization).toBe('Bearer test-jwt');
    // Payload: exakt die Plus-Jahres-Price-ID + Return-URLs
    const body = JSON.parse(call[1].body);
    expect(body.price_id).toBe(PRICE_IDS.plus_year);
    expect(body.success_url).toBe('http://localhost/onboarding?checkout=success');
    expect(body.cancel_url).toBe('http://localhost/');

    // WeWeb-Event checkout-started mit Plan + Abrechnungsart
    const events = wrapper.emitted('trigger-event') || [];
    const started = events.map(([e]) => e).find((e) => e.name === 'checkout-started');
    expect(started).toBeTruthy();
    expect(started.event).toEqual({ plan: 'plus', billing: 'year' });
  });

  it('CTA «Basis starten» (monatlich): sendet die Basis-Monats-Price-ID', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://checkout.stripe.com/test-session' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountComponent({ authToken: 'test-jwt' });
    await wrapper.findAll('.abo-card__cta')[0].trigger('click');
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
    await wrapper.findAll('.abo-card__cta')[0].trigger('click');
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
    await wrapper.findAll('.abo-card__cta')[1].trigger('click');
    await flush();

    expect(wrapper.vm.errorMsg).toBe('Preis nicht gefunden.');
    expect(wrapper.vm.busy).toBe(false);
    const events = (wrapper.emitted('trigger-event') || []).map(([e]) => e);
    const errorEvent = events.find((e) => e.name === 'error');
    expect(errorEvent).toBeTruthy();
    expect(errorEvent.event).toEqual({ reason: 'checkout', status: 500 });
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
  it('Grundgeruest nutzt .hrk-root/.hrk-page/.hrk-card, CTAs sind .hrk-btn — genau ein Primary', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.hrk-root').exists()).toBe(true);
    expect(wrapper.find('.hrk-page').exists()).toBe(true);
    expect(wrapper.find('.hrk-h1').text()).toBe('Wähle dein Imploya-Abo');
    // Beide Plan-Karten bauen auf .hrk-card auf
    expect(wrapper.findAll('.hrk-card').length).toBe(2);
    // Design-Regel: genau EIN .hrk-btn--primary pro Seite (Plus), Basis ist secondary
    expect(wrapper.findAll('.hrk-btn--primary').length).toBe(1);
    expect(wrapper.findAll('.hrk-btn--secondary').length).toBe(1);
    for (const cta of wrapper.findAll('.abo-card__cta')) {
      expect(cta.classes()).toContain('hrk-btn');
    }
  });
});
