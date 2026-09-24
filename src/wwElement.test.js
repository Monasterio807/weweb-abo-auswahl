// =============================================================================
// wwElement.test.js — weweb-abo-auswahl (Testabdeckung Phase 2b)
// v4 (02.08.2026): Ein-Plan-Modell (Plus eingestellt) — Tests auf die eine
// verbleibende Karte (Basis / «Imploya») umgestellt: Preis, Monats/Jahres-
// Toggle mit exakter Preislogik (290/«2 Monate gratis»), Auswahl-Zustand,
// Stripe-Checkout (Payload mit korrekter price_id, Header, Events,
// Fehlerpfade) und Design-System-Regression (.hrk-*-Klassen).
// v5 (14.09.2026, ECC-vue#1): zwei Tests fuer fetchWithTimeout ergaenzt —
// echtes AbortSignal am stripe-checkout-Aufruf, plus der Timeout-Fall
// (AbortError -> eigene Meldung, error-Event reason "timeout", Button frei).
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
  // Fix-Runde 24.09.2026: Planname «Basis» statt «Imploya» (Entscheid 9, s6-B11), Leistungszeilen
  // ohne Gedankenstrich und im Wortlaut von /abo (s1-B15). Ohne supabaseUrl wird plan_prices
  // nicht geladen: die Karte zeigt ihren Anzeigewert 29 (siehe preisMonatChf).
  it('rendert genau eine Karte: Basis (CHF 29/Monat)', () => {
    const wrapper = mountComponent();
    const cards = wrapper.findAll('.abo-card');
    expect(cards.length).toBe(1);

    const basis = cards[0];
    expect(basis.find('.abo-card__name').text()).toBe('Basis');
    expect(basis.find('.abo-card__amount').text()).toBe('CHF 29');
    expect(basis.find('.abo-card__period').text()).toBe('/Monat');

    expect(basis.text()).toContain('30 Fragen an Emily pro Monat');
    expect(basis.text()).toContain('15 Dokumente pro Monat');
    expect(basis.text()).not.toMatch(/[—–]/);
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
    // Fix-Runde 24.09.2026 (s6-B02, Entscheid 8): frueher stand hier fest «statt CHF 348/Jahr»
    // (12 x Aktionspreis, eine Zahl, die niemand zahlt). Der Bezugspreis kommt jetzt nur noch
    // aus plan_prices (Test unten). Ohne geladene Preise bleibt allein «2 Monate gratis».
    const savings = wrapper.findAll('.abo-card__saving').map((n) => n.text());
    expect(savings[0]).toBe('2 Monate gratis');
    expect(savings[0]).not.toContain('348');
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
    // Entscheid 1 (20.09.2026): Rueckkehr nach dem Checkout fuehrt in die
    // Vertrags-Strecke, nicht mehr in den alten Wizard auf /onboarding.
    expect(body.success_url).toBe('http://localhost/vertrag-erstellen?checkout=success');
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

// ECC-vue#1 (14.09.2026): fetchWithTimeout fuer Token-Refresh + stripe-checkout (Erst-
// und 401-Retry-Aufruf). Zwei Dinge werden geprueft: dass der Checkout-Aufruf wirklich mit
// einem echten AbortSignal laeuft (kein reiner Mock-Bypass) und dass ein Abbruch (AbortError)
// eine eigene, verstaendliche Meldung zeigt statt des generischen Netzwerkfehlers, ein
// error-Event mit reason "timeout" feuert und der Button wieder freigegeben wird.
describe('Timeout (fetchWithTimeout)', () => {
  it('stripe-checkout-Aufruf traegt ein echtes AbortSignal (AbortController tatsaechlich verdrahtet)', async () => {
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
    expect(call).toBeTruthy();
    expect(call[1].signal).toBeInstanceOf(AbortSignal);
  });

  it('Timeout (AbortError) beim Checkout: eigene Meldung, error-Event reason "timeout", Button wieder frei', async () => {
    const abortError = Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
    const fetchMock = vi.fn(async () => { throw abortError; });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountComponent({ authToken: 'test-jwt' });
    await wrapper.find('.abo-card__cta').trigger('click');
    await flush();

    expect(wrapper.vm.errorMsg).toBe('Verbindung dauert zu lange, bitte nochmals versuchen.');
    expect(wrapper.vm.busy).toBe(false);

    const events = (wrapper.emitted('trigger-event') || []).map(([e]) => e);
    const errorEvent = events.find((e) => e.name === 'error');
    expect(errorEvent).toBeTruthy();
    expect(errorEvent.event.reason).toBe('timeout');

    // Button ist wieder anklickbar (busy=false hebt :disabled auf)
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.abo-card__cta').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('.abo-error').text()).toBe('Verbindung dauert zu lange, bitte nochmals versuchen.');
  });
});

describe('Design-System-Regression (.hrk-* Tokens/Klassen)', () => {
  it('Grundgeruest nutzt .hrk-root/.hrk-page/.hrk-card, CTA ist .hrk-btn--primary', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.hrk-root').exists()).toBe(true);
    expect(wrapper.find('.hrk-page').exists()).toBe(true);
    // Fix-Runde 24.09.2026 (Entscheid 9, s6-B11): «Wähle dein Abo» statt «Wähle dein Imploya-Abo».
    expect(wrapper.find('.hrk-h1').text()).toBe('Wähle dein Abo');
    // Eine Plan-Karte baut auf .hrk-card auf
    expect(wrapper.findAll('.hrk-card').length).toBe(1);
    // Design-Regel: genau EIN .hrk-btn--primary pro Seite
    expect(wrapper.findAll('.hrk-btn--primary').length).toBe(1);
    expect(wrapper.findAll('.hrk-btn--secondary').length).toBe(0);
    expect(wrapper.find('.abo-card__cta').classes()).toContain('hrk-btn');
  });
});

// ---------------------------------------------------------------------------
// Fix-Runde 24.09.2026 (Vollaudit Kundensicht, Buendel F29): Preise und Bezugspreis
// aus plan_prices, Gratismonat-Satz wie /abo, Texte ohne Gedankenstrich.
// ---------------------------------------------------------------------------
describe('F29: Preise aus plan_prices (Entscheid 8)', () => {
  const PLAN_PRICES = [
    { plan: 'basis', interval: 'month', active: true, stripe_price_id: PRICE_IDS.basis_month, amount_rappen: 2900 },
    { plan: 'basis', interval: 'year', active: true, stripe_price_id: PRICE_IDS.basis_year, amount_rappen: 29000 },
    { plan: 'basis', interval: 'month', active: false, stripe_price_id: 'price_normal_month', amount_rappen: 3900 },
    { plan: 'basis', interval: 'year', active: false, stripe_price_id: 'price_normal_year', amount_rappen: 39000 },
  ];
  const stubPreise = (rows, calls = []) => vi.fn(async (url, opt) => {
    calls.push({ url: String(url), opt });
    return { ok: true, status: 200, json: async () => rows };
  });
  const URL_ZH = 'https://ztvqsxdudzdyqgeylujr.supabase.co';

  it('Jahr: «statt CHF 390 im Jahr, 2 Monate gratis» aus der inaktiven Normalpreis-Zeile', async () => {
    const calls = [];
    vi.stubGlobal('fetch', stubPreise(PLAN_PRICES, calls));
    const wrapper = mountComponent({ supabaseUrl: URL_ZH });
    await flush();
    await wrapper.findAll('.abo-toggle__btn')[1].trigger('click');
    expect(wrapper.find('.abo-card__amount').text()).toBe('CHF 290');
    expect(wrapper.find('.abo-card__saving').text()).toBe('statt CHF 390 im Jahr, 2 Monate gratis');
    // oeffentliche Tabelle: nur der Anon-Key geht mit, kein Nutzer-Token noetig
    const c = calls.find((x) => x.url.includes('/rest/v1/plan_prices'));
    expect(c.url).toContain('plan=eq.basis');
    expect(c.opt.headers.apikey).toBe('test-anon-key');
  });

  // Nachbesserung 24.09.2026 (Prüfung W1): ohne Login ist die Trial-Berechtigung unbekannt,
  // darum der vorsichtige Wortlaut «Beim ersten Abo …» statt eines festen Gratis-Versprechens.
  it('Betraege folgen der DB (nicht fest verdrahtet): Monat 3100 -> CHF 31, auch im Einleitungssatz', async () => {
    const rows = PLAN_PRICES.map((r) => (r.stripe_price_id === PRICE_IDS.basis_month ? { ...r, amount_rappen: 3100 } : r));
    vi.stubGlobal('fetch', stubPreise(rows));
    const wrapper = mountComponent({ supabaseUrl: URL_ZH });
    await flush();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.abo-card__amount').text()).toBe('CHF 31');
    expect(wrapper.find('.abo-header .hrk-muted').text()).toBe('Beim ersten Abo ist der erste Monat gratis, ohne Kreditkarte. Danach zahlst du CHF 31 im Monat.');
  });

  it('ohne Normalpreis-Zeile kein Bezugspreis (keine erfundene 390)', async () => {
    vi.stubGlobal('fetch', stubPreise(PLAN_PRICES.filter((r) => r.active)));
    const wrapper = mountComponent({ supabaseUrl: URL_ZH });
    await flush();
    await wrapper.findAll('.abo-toggle__btn')[1].trigger('click');
    expect(wrapper.find('.abo-card__saving').text()).toBe('2 Monate gratis');
  });

  it('Lesefehler: Karte behaelt ihren Anzeigewert, keine Fehlermeldung fuer den Kunden', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountComponent({ supabaseUrl: URL_ZH });
    await flush();
    expect(wrapper.find('.abo-card__amount').text()).toBe('CHF 29');
    expect(wrapper.vm.errorMsg).toBe('');
  });

  // Nachbesserung 24.09.2026 (Prüfung W1/K3): ohne Login unbekannte Trial-Berechtigung (vorsichtiger
  // Wortlaut), ohne geladene plan_prices-Zeile kein Betrag im Satz.
  it('Texte: Einleitung ohne «jederzeit kündbar», «Noch nicht, ich schau mich erst um», kein Gedankenstrich', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.abo-header .hrk-muted').text()).toBe('Beim ersten Abo ist der erste Monat gratis, ohne Kreditkarte.');
    expect(wrapper.text()).not.toContain('jederzeit kündbar');
    expect(wrapper.find('.abo-later__btn').text()).toBe('Noch nicht, ich schau mich erst um');
    expect(wrapper.text()).not.toMatch(/[—–]/);
    expect(wrapper.text()).not.toContain('Imploya');
  });
});

// ---------------------------------------------------------------------------
// Nachbesserung 24.09.2026 (Prüfung W1, K1): Gratismonat nur versprechen, wenn es noch keine
// subscriptions-Zeile gibt (gleiche Regel wie stripe-checkout «Trial prüfen» und /abo).
// ---------------------------------------------------------------------------
describe('F29 Nachbesserung: Trial-Berechtigung', () => {
  const B64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
  const JWT = `x.${B64({ sub: 'user-1' })}.y`;
  const URL_ZH = 'https://ztvqsxdudzdyqgeylujr.supabase.co';
  const PREISE = [
    { plan: 'basis', interval: 'month', active: true, stripe_price_id: PRICE_IDS.basis_month, amount_rappen: 2900 },
    { plan: 'basis', interval: 'year', active: true, stripe_price_id: PRICE_IDS.basis_year, amount_rappen: 29000 },
    { plan: 'basis', interval: 'year', active: false, stripe_price_id: 'n', amount_rappen: 39000 },
  ];
  const route = (subs, calls = []) => vi.fn(async (url, opt) => {
    const u = String(url); calls.push({ u, opt });
    if (u.includes('/rest/v1/subscriptions?')) {
      if (subs === 'fehler') return { ok: false, status: 500, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => subs };
    }
    if (u.includes('/rest/v1/plan_prices')) return { ok: true, status: 200, json: async () => PREISE };
    return { ok: true, status: 200, json: async () => [] };
  });
  const einl = (w) => w.find('.abo-header .hrk-muted').text();

  it('Neukunde (keine subscriptions-Zeile): Gratismonat, Abfrage auf eigene user_id mit User-JWT', async () => {
    const calls = [];
    vi.stubGlobal('fetch', route([], calls));
    const w = mountComponent({ authToken: JWT, supabaseUrl: URL_ZH });
    await flush(); await w.vm.$nextTick();
    expect(einl(w)).toBe('Der erste Monat im Abo ist gratis, ohne Kreditkarte. Danach zahlst du CHF 29 im Monat.');
    const c = calls.find((x) => x.u.includes('/rest/v1/subscriptions?'));
    expect(c.u).toContain('user_id=eq.user-1');
    expect(c.opt.headers.Authorization).toBe('Bearer ' + JWT);
  });

  it('Rückkehrer (Zeile da): kein Gratis-Versprechen, kein «ohne Kreditkarte»', async () => {
    vi.stubGlobal('fetch', route([{ id: 's-1' }]));
    const w = mountComponent({ authToken: JWT, supabaseUrl: URL_ZH });
    await flush(); await w.vm.$nextTick();
    expect(einl(w)).toBe('Das Abo kostet CHF 29 im Monat.');
    expect(w.text()).not.toContain('gratis, ohne Kreditkarte');
  });

  it('Lesefehler: vorsichtiger Wortlaut «Beim ersten Abo …»', async () => {
    vi.stubGlobal('fetch', route('fehler'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const w = mountComponent({ authToken: JWT, supabaseUrl: URL_ZH });
    await flush(); await w.vm.$nextTick();
    expect(w.vm.trialBerechtigt).toBe(null);
    expect(einl(w)).toBe('Beim ersten Abo ist der erste Monat gratis, ohne Kreditkarte. Danach zahlst du CHF 29 im Monat.');
  });

  it('K1: Umschalter «Jährlich» -> Betrag im Jahr', async () => {
    vi.stubGlobal('fetch', route([]));
    const w = mountComponent({ authToken: JWT, supabaseUrl: URL_ZH });
    await flush();
    await w.findAll('.abo-toggle__btn')[1].trigger('click');
    expect(einl(w)).toBe('Der erste Monat im Abo ist gratis, ohne Kreditkarte. Danach zahlst du CHF 290 im Jahr.');
  });
});
