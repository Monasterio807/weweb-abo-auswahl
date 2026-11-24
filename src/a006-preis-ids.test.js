// =============================================================================
// a006-preis-ids.test.js — A-006 (24.11.2026): Preis-ID aus der aktiven plan_prices-Zeile
// Regel: Die Komponente schickt an stripe-checkout die stripe_price_id der AKTIVEN Zeile
// (plan = basis) des gewählten Intervalls. Keine feste ID im Code. Fehlt die Zeile, startet
// kein Kauf und es steht ein klarer Satz da.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import wwElement from './wwElement.vue';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const URL_ZH = 'https://ztvqsxdudzdyqgeylujr.supabase.co';
const B64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
const JWT = `x.${B64({ sub: 'user-1' })}.y`;

// Die alten, früher fest hinterlegten IDs. Im Test sind sie INAKTIV, die aktiven Zeilen
// tragen andere IDs (so sieht es am Starttag aus, wenn die Live-Zeilen gesetzt sind).
const ALT = { m: 'price_1TnxRXFLoauOOkHyLbCG9e4j', y: 'price_1USIfzFLoauOOkHy6yp9t1N0' };
const LIVE = { m: 'price_LIVE_monat', y: 'price_LIVE_jahr' };
const ZEILEN = [
  { plan: 'basis', interval: 'month', active: false, stripe_price_id: ALT.m, amount_rappen: 2900 },
  { plan: 'basis', interval: 'year', active: false, stripe_price_id: ALT.y, amount_rappen: 31900 },
  { plan: 'basis', interval: 'month', active: true, stripe_price_id: LIVE.m, amount_rappen: 4200 },
  { plan: 'basis', interval: 'year', active: true, stripe_price_id: LIVE.y, amount_rappen: 46200 },
];

const route = (preise, calls = []) => vi.fn(async (url, opt) => {
  const u = String(url); calls.push({ u, opt });
  if (u.includes('/rest/v1/plan_prices')) return { ok: true, status: 200, json: async () => preise };
  if (u.includes('/functions/v1/stripe-checkout')) return { ok: true, status: 200, json: async () => ({ url: 'https://checkout.stripe.com/x' }) };
  return { ok: true, status: 200, json: async () => [] };
});
const mountIt = () => mount(wwElement, { props: { content: { authToken: JWT, apiKey: 'k', supabaseUrl: URL_ZH }, uid: 't' } });
const checkoutCalls = (calls) => calls.filter((c) => c.u.includes('/functions/v1/stripe-checkout'));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('A-006: Preis-ID kommt aus der aktiven plan_prices-Zeile', () => {
  it('Monat: schickt die ID der aktiven Monats-Zeile, nicht die alte feste', async () => {
    const calls = [];
    vi.stubGlobal('fetch', route(ZEILEN, calls));
    const w = mountIt();
    await flush(); await w.vm.$nextTick();
    await w.find('.abo-card__cta').trigger('click');
    await flush();
    const c = checkoutCalls(calls);
    expect(c.length).toBe(1);
    expect(JSON.parse(c[0].opt.body).price_id).toBe(LIVE.m);
  });

  it('Jahr: schickt die ID der aktiven Jahres-Zeile', async () => {
    const calls = [];
    vi.stubGlobal('fetch', route(ZEILEN, calls));
    const w = mountIt();
    await flush(); await w.vm.$nextTick();
    await w.findAll('.abo-toggle__btn')[1].trigger('click');
    await w.find('.abo-card__cta').trigger('click');
    await flush();
    const c = checkoutCalls(calls);
    expect(c.length).toBe(1);
    expect(JSON.parse(c[0].opt.body).price_id).toBe(LIVE.y);
  });

  it('Klick vor dem Laden: wartet auf plan_prices und schickt dann die richtige ID', async () => {
    const calls = [];
    vi.stubGlobal('fetch', route(ZEILEN, calls));
    const w = mountIt();
    // kein flush: plan_prices ist beim Klick noch nicht angekommen
    await w.find('.abo-card__cta').trigger('click');
    await flush(); await flush();
    const c = checkoutCalls(calls);
    expect(c.length).toBe(1);
    expect(JSON.parse(c[0].opt.body).price_id).toBe(LIVE.m);
  });

  it('keine aktive Jahres-Zeile: kein Aufruf von stripe-checkout, klarer Satz', async () => {
    const calls = [];
    const ohneJahr = ZEILEN.filter((z) => !(z.interval === 'year' && z.active));
    vi.stubGlobal('fetch', route(ohneJahr, calls));
    const w = mountIt();
    await flush(); await w.vm.$nextTick();
    await w.findAll('.abo-toggle__btn')[1].trigger('click');
    await w.find('.abo-card__cta').trigger('click');
    await flush();
    expect(checkoutCalls(calls).length).toBe(0);
    expect(w.find('.abo-error, [role="alert"]').exists()).toBe(true);
    expect(w.text()).toContain('Das Abo lässt sich gerade nicht bestellen.');
    const ev = (w.emitted('trigger-event') || []).map(([e]) => e);
    expect(ev.find((e) => e.name === 'checkout-started')).toBeUndefined();
    expect(ev.find((e) => e.name === 'error').event.reason).toBe('kein-preis');
  });

  it('plan_prices nicht ladbar: kein Kauf mit einer geratenen ID', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, opt) => {
      calls.push({ u: String(url), opt });
      if (String(url).includes('/rest/v1/plan_prices')) return { ok: false, status: 500, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ url: 'https://checkout.stripe.com/x' }) };
    }));
    const w = mountIt();
    await flush(); await w.vm.$nextTick();
    await w.find('.abo-card__cta').trigger('click');
    await flush();
    expect(checkoutCalls(calls).length).toBe(0);
    expect(w.text()).toContain('Das Abo lässt sich gerade nicht bestellen.');
  });
});

describe('A-006: Doppelklick während plan_prices lädt', () => {
  it('zwei schnelle Klicks ergeben genau einen Aufruf von stripe-checkout', async () => {
    const calls = [];
    vi.stubGlobal('fetch', route(ZEILEN, calls));
    const w = mountIt();
    const cta = w.find('.abo-card__cta');
    cta.trigger('click');
    cta.trigger('click');
    await flush(); await flush();
    expect(checkoutCalls(calls).length).toBe(1);
  });
});
