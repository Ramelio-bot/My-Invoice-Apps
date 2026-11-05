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

      // Pre-populate internal Invoice.jsx draft ('draft_invoice')
      const mappedItems = Array.isArray(payload.items)
        ? payload.items.map((it, idx) => ({
            id: it.id || Date.now() + idx,
            desc: it.name || '',
            qty: Number(it.qty) || 1,
            unit: 'pcs',
            price: Number(it.price) || 0,
            total: (Number(it.qty) || 1) * (Number(it.price) || 0)
          }))
        : [];

      const invoiceDraft = {
        companyName: payload.businessName || '',
        companyAddress: payload.businessContact || '',
        companyCity: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        companyLogo: '',
        clientName: payload.clientName || '',
        clientAddress: payload.clientContact || '',
        clientPhone: '',
        clientEmail: '',
        number: payload.invoiceNumber || 'INV-2026/042',
        date: payload.issueDate || new Date().toISOString().split('T')[0],
        dueDate: payload.dueDate || '',
        currency: 'IDR',
        status: payload.status === 'LUNAS' ? 'paid' : 'waiting',
        items: mappedItems,
        discount: payload.discount || '',
        tax: payload.enableTax ? 11 : '',
        notes: payload.notes || '',
        bank: payload.bankName || '',
        accountNumber: payload.accountNumber || '',
        accountName: payload.accountHolder || '',
        paymentInstructions: '',
        qrisUrl: ''
      };
      localStorage.setItem('draft_invoice', JSON.stringify(invoiceDraft));
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

      const kwitansiDraft = {
        number: payload.receiptNumber || 'KWT-2026/088',
        date: payload.date || new Date().toISOString().split('T')[0],
        receivedFrom: payload.receivedFrom || '',
        amount: Number(payload.amount) || 0,
        description: payload.forPayment || '',
        receiverName: payload.signerName || '',
        receiverTitle: payload.signerRole || '',
        signature: null,
        stamp: null
      };
      localStorage.setItem('kwitansi_draft', JSON.stringify(kwitansiDraft));
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

      const sphDraft = {
        number: payload.quoteNumber || 'SPH/2026/11/001',
        date: payload.issueDate || new Date().toISOString().split('T')[0],
        validUntil: payload.validUntil || '',
        toName: payload.clientName || '',
        toCompany: payload.clientCompany || '',
        toAddress: payload.clientAddress || '',
        toEmail: '',
        items: Array.isArray(payload.items)
          ? payload.items.map(it => ({
              name: it.name || '',
              qty: Number(it.qty) || 1,
              price: Number(it.price) || 0
            }))
          : [],
        notes: payload.openingNote || '',
        terms: payload.terms || '',
        status: 'draft'
      };
      localStorage.setItem('sph_draft', JSON.stringify(sphDraft));

      // Also populate draft_invoice so 1-Click Convert Quote -> Invoice works seamlessly
      const mappedInvoiceItems = Array.isArray(payload.items)
        ? payload.items.map((it, idx) => ({
            id: it.id || Date.now() + idx,
            desc: it.name || '',
            qty: Number(it.qty) || 1,
            unit: 'pcs',
            price: Number(it.price) || 0,
            total: (Number(it.qty) || 1) * (Number(it.price) || 0)
          }))
        : [];

      const convertedInvoiceDraft = {
        companyName: payload.businessName || '',
        companyAddress: payload.businessContact || '',
        companyCity: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        companyLogo: '',
        clientName: payload.clientCompany
          ? `${payload.clientName || ''} (${payload.clientCompany})`.trim()
          : (payload.clientName || ''),
        clientAddress: payload.clientAddress || '',
        clientPhone: '',
        clientEmail: '',
        number: (payload.quoteNumber || 'SPH-2026/001').replace(/^SPH/i, 'INV'),
        date: new Date().toISOString().split('T')[0],
        dueDate: payload.validUntil || '',
        currency: 'IDR',
        status: 'unpaid',
        items: mappedInvoiceItems,
        discount: payload.discount || '',
        tax: payload.enableTax ? 11 : '',
        notes: payload.terms || '',
        bank: '',
        accountNumber: '',
        accountName: '',
        paymentInstructions: '',
        qrisUrl: ''
      };
      localStorage.setItem('draft_invoice', JSON.stringify(convertedInvoiceDraft));
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
      localStorage.setItem('myinvoice_hpp_carryover', JSON.stringify(hppRecipe));
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
