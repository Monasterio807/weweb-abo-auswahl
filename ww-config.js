export default {
  editor: {
    label: { en: 'Abo-Auswahl', de: 'Abo-Auswahl' },
    icon: 'credit-card',
  },
  triggerEvents: [
    { name: 'plan-selected', label: { en: 'Plan selected', de: 'Abo ausgewählt' }, event: { plan: '', plan_price_id: '' } },
    { name: 'checkout-started', label: { en: 'Checkout started', de: 'Checkout gestartet' }, event: { plan: '' } },
    { name: 'skipped', label: { en: 'Skipped (later)', de: 'Übersprungen (später)' }, event: {} },
    { name: 'error', label: { en: 'On error', de: 'Fehler' }, event: { reason: '' } },
  ],
  properties: {
    authToken: {
      label: { en: 'User JWT (auth token)', de: 'User-JWT (Login-Token)' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '',
    },
    apiKey: {
      label: { en: 'Supabase anon key', de: 'Supabase Anon-Key' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '',
    },
    supabaseUrl: {
      label: { en: 'Supabase URL', de: 'Supabase-URL' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'https://ztvqsxdudzdyqgeylujr.supabase.co',
    },
    onboardingUrl: {
      label: { en: 'Onboarding URL', de: 'Onboarding-URL' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '/onboarding',
    },
    checkoutReturnUrl: {
      label: { en: 'Checkout return URL', de: 'URL nach Checkout' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '/onboarding',
    },
  },
};
