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

const SAMPLE_BUSINESS_NAMES = new Set([
  'Studio Desain & Kreatif',
  'Creative & Design Studio',
  'Kreasi Digital Nusantara'
]);

const CARRYOVER_TTL_MS = 24 * 60 * 60 * 1000;

function computePercentDiscount(items = [], nominalDiscount = 0) {
  const discountVal = Number(nominalDiscount) || 0;
  if (discountVal <= 0) return '';
  const subtotal = (Array.isArray(items) ? items : []).reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0
  );
  if (subtotal <= 0) return '';
  return Number(((discountVal / subtotal) * 100).toFixed(2));
}

/**
 * Saves public free-tool data into localStorage so when a visitor registers an account,
 * OnboardingWizard and the target module (/invoice, /kwitansi, /penawaran-harga, /hitung-hpp)
 * auto-populate with zero data loss.
 */
export function savePublicCarryover(sourceType, payload = {}) {
  try {
    if (typeof window === 'undefined') return;

    // Do not capture passive carryover if user is already logged in (allow explicit 1-click quote conversion)
    const isUserLoggedIn = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (isUserLoggedIn && sourceType !== 'quotation_to_invoice') return;

    const cleanStoreName = SAMPLE_BUSINESS_NAMES.has(payload.businessName) ? '' : (payload.businessName || '');
    const cleanStoreAddress = cleanStoreName ? (payload.businessContact || '') : '';

    if (sourceType === 'invoice') {
      const isSample =
        payload.clientName === 'PT Maju Cipta Sejahtera' &&
        SAMPLE_BUSINESS_NAMES.has(payload.businessName);

      const docDraft = isSample ? null : {
        companyName: payload.businessName || '',
        companyAddress: payload.businessContact || '',
        clientName: payload.clientName || '',
        clientAddress: payload.clientContact || '',
        dueDate: payload.dueDate || '',
        currency: payload.currency || 'IDR',
        status: payload.status === 'LUNAS' ? 'paid' : 'unpaid',
        items: (Array.isArray(payload.items) ? payload.items : []).map((it, idx) => ({
          id: it.id || Date.now() + idx,
          desc: it.name || '',
          qty: Number(it.qty) || 1,
          unit: 'pcs',
          price: Number(it.price) || 0,
          total: (Number(it.qty) || 0) * (Number(it.price) || 0)
        })),
        discount: computePercentDiscount(payload.items, payload.discount),
        tax: payload.customTaxRate || '',
        taxType: payload.taxType || 'none',
        bank: payload.bankName || '',
        accountNumber: payload.accountNumber || '',
        accountName: payload.accountHolder || '',
        notes: payload.notes || ''
      };

      const carry = {
        source: 'invoice',
        storeName: cleanStoreName,
        storeAddress: cleanStoreAddress,
        businessType: 'jasa',
        mainFeatures: ['invoice'],
        targetRoute: '/invoice',
        docDraft,
        updatedAt: Date.now()
      };
      localStorage.setItem('myinvoice_carryover', JSON.stringify(carry));
    } else if (sourceType === 'kwitansi') {
      const isSample =
        payload.receivedFrom === 'PT Maju Cipta Sejahtera' &&
        payload.signerName === 'Andi Pratama';

      const docDraft = isSample ? null : {
        receivedFrom: payload.receivedFrom || '',
        amount: String(payload.amount || ''),
        description: payload.forPayment || '',
        receiverName: payload.signerName || '',
        receiverTitle: payload.signerRole || ''
      };

      const carry = {
        source: 'kwitansi',
        storeName: cleanStoreName,
        storeAddress: cleanStoreAddress,
        businessType: 'jasa',
        mainFeatures: ['invoice'],
        targetRoute: '/kwitansi',
        docDraft,
        updatedAt: Date.now()
      };
      localStorage.setItem('myinvoice_carryover', JSON.stringify(carry));
    } else if (sourceType === 'quotation' || sourceType === 'quotation_to_invoice') {
      const isConvert = sourceType === 'quotation_to_invoice';
      const isSample =
        !isConvert &&
        payload.clientCompany === 'PT Sinar Logistik Terpadu' &&
        SAMPLE_BUSINESS_NAMES.has(payload.businessName);

      const docDraft = isSample
        ? null
        : isConvert
          ? {
              companyName: payload.businessName || '',
              companyAddress: payload.businessContact || '',
              clientName: payload.clientCompany || payload.clientName || '',
              clientAddress: payload.clientAddress || '',
              dueDate: payload.validUntil || '',
              currency: 'IDR',
              status: 'unpaid',
              items: (Array.isArray(payload.items) ? payload.items : []).map((it, idx) => ({
                id: it.id || Date.now() + idx,
                desc: it.name || '',
                qty: Number(it.qty) || 1,
                unit: 'pcs',
                price: Number(it.price) || 0,
                total: (Number(it.qty) || 0) * (Number(it.price) || 0)
              })),
              discount: computePercentDiscount(payload.items, payload.discount),
              tax: payload.customTaxRate || '',
              taxType: payload.taxType || 'none',
              notes: payload.terms || ''
            }
          : {
              validUntil: payload.validUntil || '',
              toName: payload.clientName || '',
              toCompany: payload.clientCompany || '',
              toAddress: payload.clientAddress || '',
              items: (Array.isArray(payload.items) ? payload.items : []).map((it) => ({
                name: it.name || '',
                qty: Number(it.qty) || 1,
                price: Number(it.price) || 0
              })),
              notes: payload.openingNote || '',
              terms: payload.terms || '',
              status: 'draft'
            };

      const carry = {
        source: sourceType,
        storeName: cleanStoreName,
        storeAddress: cleanStoreAddress,
        businessType: 'jasa',
        mainFeatures: ['invoice'],
        targetRoute: isConvert ? '/invoice' : '/penawaran-harga',
        docDraft,
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

      const isDefaultHpp =
        ['Es Kopi Susu Gula Aren', 'Iced Brown Sugar Latte'].includes(hppRecipe.productName) &&
        hppRecipe.sellingPrice === 18000 &&
        Number(payload.overheadPerUnit) === 1000 &&
        mappedMaterials.length === 4;

      const carry = {
        source: 'hpp',
        storeName: '',
        storeAddress: '',
        businessType: 'kuliner',
        mainFeatures: ['kasir'],
        targetRoute: '/hitung-hpp',
        hppRecipe,
        isCustomized: !isDefaultHpp,
        updatedAt: Date.now()
      };
      localStorage.setItem('myinvoice_carryover', JSON.stringify(carry));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getPublicCarryover() {
  try {
    const raw = localStorage.getItem('myinvoice_carryover');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.updatedAt && Date.now() - Number(parsed.updatedAt) > CARRYOVER_TTL_MS) {
      localStorage.removeItem('myinvoice_carryover');
      return null;
    }
    return parsed;
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

/**
 * Consume carryover draft once on the destination app page when source matches.
 */
export function consumePublicCarryover(allowedSources = []) {
  const carry = getPublicCarryover();
  if (!carry) return null;
  if (allowedSources.length > 0 && !allowedSources.includes(carry.source)) {
    return null;
  }
  clearPublicCarryover();
  return carry;
}
