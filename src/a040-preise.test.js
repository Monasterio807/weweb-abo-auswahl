// =============================================================================
// a040-preise.test.js — A-040 (24.11.2026): neue Preise 42 / 462 (Entscheid E65)
// Regeln: Preise nur aus der Datenbank (plan_prices, credit_service_prices), kein
// Aktionspreis, kein «ab 2028», kein «statt CHF …», ohne Daten kein Betrag.
// Ward-Vermerk A-040: «1 Monat gratis» beim Jahr ersetzt durch «11 zahlen, 12 bekommen».
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import wwElement from './wwElement.vue';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const URL_ZH = 'https://ztvqsxdudzdyqgeylujr.supabase.co';
const B64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
const JWT = `x.${B64({ sub: 'user-1' })}.y`;

// Die Komponente schickt (bis A-006) ihre fest hinterlegten IDs. Die Tests nehmen dieselben
// IDs, damit die Zeilen gefunden werden; der Betrag kommt nur aus amount_rappen.
const IDS = { m: 'price_1TnxRXFLoauOOkHyLbCG9e4j', y: 'price_1USIfzFLoauOOkHy6yp9t1N0' };
const NEU = [
  { plan: 'basis', interval: 'month', active: true, stripe_price_id: IDS.m, amount_rappen: 4200 },
  { plan: 'basis', interval: 'year', active: true, stripe_price_id: IDS.y, amount_rappen: 46200 },
  // eine teurere inaktive Zeile darf NIE einen «Normalpreis» oder «Aktionspreis» erzeugen
  { plan: 'basis', interval: 'month', active: false, stripe_price_id: 'alt_m', amount_rappen: 9900 },
  { plan: 'basis', interval: 'year', active: false, stripe_price_id: 'alt_y', amount_rappen: 99000 },
];
const CREDIT = [
  { service: 'dokument_mit_abo', amount_credits: 3 },
  { service: 'emily_10_fragen_mit_abo', amount_credits: 6 },
];
const route = ({ preise = NEU, subs = [], credit = CREDIT } = {}, calls = []) => vi.fn(async (url, opt) => {
  const u = String(url); calls.push({ u, opt });
  if (u.includes('/rest/v1/subscriptions?')) return { ok: true, status: 200, json: async () => subs };
  if (u.includes('/rest/v1/plan_prices')) return { ok: true, status: 200, json: async () => preise };
  if (u.includes('/rest/v1/credit_service_prices')) return { ok: true, status: 200, json: async () => credit };
  return { ok: true, status: 200, json: async () => [] };
});
const mountIt = (c = {}) => mount(wwElement, { props: { content: { authToken: '', apiKey: 'k', ...c }, uid: 't' } });
const einl = (w) => w.find('.abo-header .hrk-muted').text();
const VERBOTEN = /Aktionspreis|ab 2028|statt CHF|Ende 2027/;

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('A-040: Monat 42 und Jahr 462 aus plan_prices', () => {
  it('Neukunde, Monat: Betrag 42, Satz ohne Aktionspreis', async () => {
    vi.stubGlobal('fetch', route());
    const w = mountIt({ authToken: JWT, supabaseUrl: URL_ZH });
    await flush(); await w.vm.$nextTick();
    expect(w.find('.abo-card__amount').text()).toBe('CHF 42');
    expect(einl(w)).toBe('Der erste Monat im Abo ist gratis, ohne Kreditkarte. Danach zahlst du CHF 42 im Monat.');
    expect(w.text()).not.toMatch(VERBOTEN);
  });

  it('Rückkehrer, Monat: «Das Abo kostet CHF 42 im Monat.»', async () => {
    vi.stubGlobal('fetch', route({ subs: [{ id: 's' }] }));
    const w = mountIt({ authToken: JWT, supabaseUrl: URL_ZH });
    await flush(); await w.vm.$nextTick();
    expect(einl(w)).toBe('Das Abo kostet CHF 42 im Monat.');
  });

  it('Jahr: Betrag 462, «Du zahlst 11 Monate und bekommst 12.», kein «statt CHF», kein «gratis» am Jahr', async () => {
    vi.stubGlobal('fetch', route());
    const w = mountIt({ supabaseUrl: URL_ZH });
    await flush();
    await w.findAll('.abo-toggle__btn')[1].trigger('click');
    expect(w.find('.abo-card__amount').text()).toBe('CHF 462');
    expect(w.find('.abo-card__saving').text()).toBe('Du zahlst 11 Monate und bekommst 12.');
    expect(w.find('.abo-toggle__save').text()).toBe('11 zahlen, 12 bekommen');
    expect(w.text()).not.toMatch(VERBOTEN);
    expect(w.text()).not.toContain('1 Monat gratis');
  });

  it('Jahr geht nicht glatt auf (z.B. 46000 / 4200): kein Monate-Satz statt einer schiefen Zahl', async () => {
    const preise = NEU.map((r) => (r.stripe_price_id === IDS.y ? { ...r, amount_rappen: 46000 } : r));
    vi.stubGlobal('fetch', route({ preise }));
    const w = mountIt({ supabaseUrl: URL_ZH });
    await flush();
    await w.findAll('.abo-toggle__btn')[1].trigger('click');
    expect(w.find('.abo-card__saving').exists()).toBe(false);
    expect(w.find('.abo-toggle__save').exists()).toBe(false);
  });

  it('ohne geladene Preise: kein Betrag (keine 29, keine 319, keine 42)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const w = mountIt();
    expect(w.find('.abo-card__amount').exists()).toBe(false);
    expect(w.text()).not.toMatch(/CHF\s*\d/);
    expect(einl(w)).toBe('Beim ersten Abo ist der erste Monat gratis, ohne Kreditkarte.');
  });

  it('Lesefehler plan_prices: kein Betrag, keine Fehlermeldung für den Kunden', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const w = mountIt({ supabaseUrl: URL_ZH });
    await flush();
    expect(w.find('.abo-card__amount').exists()).toBe(false);
    expect(w.vm.errorMsg).toBe('');
  });
});

describe('A-040: Hinweis Einzelpreise aus credit_service_prices (G9-09)', () => {
  it('angemeldet: Zeile mit CHF 3 und CHF 6 aus der Datenbank, Abfrage mit User-JWT', async () => {
    const calls = [];
    vi.stubGlobal('fetch', route({}, calls));
    const w = mountIt({ authToken: JWT, supabaseUrl: URL_ZH });
    await flush(); await w.vm.$nextTick();
    expect(w.find('.abo-hint-extra').text()).toBe('Zusätzliche Dokumente CHF 3/Stück · Extra Emily-Fragen CHF 6/10 Fragen');
    const c = calls.find((x) => x.u.includes('/rest/v1/credit_service_prices'));
    expect(c.u).toContain('aktiv=eq.true');
    expect(c.opt.headers.Authorization).toBe('Bearer ' + JWT);
  });

  it('nicht angemeldet (Tabelle nur für angemeldete lesbar): keine Zeile, kein Aufruf', async () => {
    const calls = [];
    vi.stubGlobal('fetch', route({}, calls));
    const w = mountIt({ supabaseUrl: URL_ZH });
    await flush();
    expect(w.find('.abo-hint-extra').exists()).toBe(false);
    expect(calls.some((x) => x.u.includes('credit_service_prices'))).toBe(false);
  });

  it('nur ein Wert geladen: keine halbe Zeile', async () => {
    vi.stubGlobal('fetch', route({ credit: [CREDIT[0]] }));
    const w = mountIt({ authToken: JWT, supabaseUrl: URL_ZH });
    await flush(); await w.vm.$nextTick();
    expect(w.find('.abo-hint-extra').exists()).toBe(false);
  });
});

describe('A-040: keine Preiszahl als Festtext im Quelltext', () => {
  const sfc = readFileSync(resolve(process.cwd(), 'src/wwElement.vue'), 'utf8');
  const template = sfc.slice(0, sfc.indexOf('<script>')).replace(/<!--[\s\S]*?-->/g, '');
  const code = sfc.slice(sfc.indexOf('<script>'), sfc.indexOf('</script>'))
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  it('Template: kein «CHF <Zahl>»', () => { expect(template).not.toMatch(/CHF\s*\d/); });
  it('Code: kein fester Ersatzwert 29/319/42/462 und kein Aktionssatz', () => {
    expect(code).not.toMatch(/['"`](29|319|42|462)['"`]/);
    expect(code).not.toMatch(VERBOTEN);
  });
});
