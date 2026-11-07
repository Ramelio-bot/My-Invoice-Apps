/**
 * Google Analytics 4 (G-8Z0KKJN775) Conversion Radar & Magic Auto-Carryover Engine
 */

export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        ...params,
        page_path: window.location?.pathname || '/'
      });
    }
  } catch {
    // Ignore if blocked by client adblocker
  }
}

/**
 * Saves public free-tool data into localStorage so when a visitor registers an account,
 * OnboardingWizard and the target module (/invoice, /kwitansi, /penawaran-harga, /hitung-hpp)
 * auto-populate with zero data loss.
 */
export function savePublicCarryover(sourceType, payload = {}) {
  try {
    if (typeof window === 'undefined') return;

    // Do not capture carryover if user is already logged in
    const isUserLoggedIn = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (isUserLoggedIn) return;

    if (sourceType === 'invoice') {
      const carry = {
        source: 'invoice',
        storeName: payload.businessName || '',
        storeAddress: payload.businessContact || '',
        businessType: 'jasa',
        mainFeatures: ['invoice'],
        targetRoute: '/invoice',
        updatedAt: Date.now()
      };
      localStorage.setItem('myinvoice_carryover', JSON.stringify(carry));
    } else if (sourceType === 'kwitansi') {
      const carry = {
        source: 'kwitansi',
        storeName: payload.businessName || '',
        storeAddress: payload.businessContact || '',
        businessType: 'jasa',
        mainFeatures: ['invoice'],
        targetRoute: '/kwitansi',
        updatedAt: Date.now()
      };
      localStorage.setItem('myinvoice_carryover', JSON.stringify(carry));
    } else if (sourceType === 'quotation' || sourceType === 'quotation_to_invoice') {
      const targetRoute = sourceType === 'quotation_to_invoice' ? '/invoice' : '/penawaran-harga';
      const carry = {
        source: sourceType,
        storeName: payload.businessName || '',
        storeAddress: payload.businessContact || '',
        businessType: 'jasa',
        mainFeatures: ['invoice'],
        targetRoute,
        updatedAt: Date.now()
      };
      localStorage.setItem('myinvoice_carryover', JSON.stringify(carry));
    } else if (sourceType === 'hpp') {
      const mappedMaterials = Array.isArray(payload.materials)
        ? payload.materials.map((m, idx) => ({
            id: m.id || Date.now() + idx,
            name: m.name || '',
            buyQty: Number(m.buyQty) || 1,
            buyUnit: m.buyUnit || 'kg',
            buyPrice: Number(m.buyPrice) || 0,
            buyUnitContent: 1,
            useQty: Number(m.useQty) || 1,
            useUnit: m.useUnit === 'gr' ? 'gram' : (m.useUnit || 'gram')
          }))
        : [];

      const hppRecipe = {
        productName: payload.productName || '',
        sellingPrice: Number(payload.sellingPrice) || 0,
        materials: mappedMaterials,
        wages: [],
        rents: [],
        utilities: [],
        misc: payload.overheadPerUnit
          ? [{ id: Date.now(), name: 'Operasional / Kemasan', amountPerUnit: Number(payload.overheadPerUnit) || 0 }]
          : [],
        marketplaceFee: 20,
        productTax: 0,
        platformFeeFixed: 0,
        platformFeeCurrency: 'Rp',
        platformFeePct: 0
      };

      const carry = {
        source: 'hpp',
        storeName: '',
        storeAddress: '',
        businessType: 'kuliner',
        mainFeatures: ['kasir'],
        targetRoute: '/hitung-hpp',
        hppRecipe,
        updatedAt: Date.now()
      };
      localStorage.setItem('myinvoice_carryover', JSON.stringify(carry));
      // No myinvoice_hpp_carryover pollution
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getPublicCarryover() {
  try {
    const raw = localStorage.getItem('myinvoice_carryover');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPublicCarryover() {
  try {
    localStorage.removeItem('myinvoice_carryover');
  } catch {
    // Ignore
  }
}
