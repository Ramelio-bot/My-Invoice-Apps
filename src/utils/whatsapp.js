/**
 * Generates a pre-filled WhatsApp message and opens wa.me link.
 *
 * @param {object} params
 * @param {string} params.phone        - recipient phone number
 * @param {string} params.docType      - 'Invoice' | 'Kwitansi' | 'Tanda Terima' | 'Penawaran' | 'Purchase Order'
 * @param {string} params.docNumber
 * @param {string} params.date
 * @param {number} params.total
 * @param {object} params.company      - company_profile object { name, phone, email }
 * @param {function} params.t          - translation function
 */
export function shareWhatsApp({ phone, clientName, docType, docNumber, date, total, company, t, isPremium = false }) {
    const isEn = t('locale_code') === 'en-US';
    const companyName = company?.full_name || company?.company_name || company?.name || (isEn ? 'Our Store' : 'Toko Kami');
//     const companyPhone = company?.phone || '';
    const formattedTotal = new Intl.NumberFormat(t('locale_code')).format(total || 0);

    const lines = [
        `${t('wa_hello')} ${clientName || ''},`,
        isEn ? `Here is your ${docType} from ${companyName}.` : `Berikut kami kirimkan ${docType} dari ${companyName}.`,
        '',
        `${t('wa_doc_num')}: ${docNumber}`,
        `${t('wa_doc_date')}: ${date}`,
        `${t('wa_doc_total')}: Rp ${formattedTotal}`,
        '',
        t('wa_contact_us'),
        '',
        isEn ? `Regards,` : `Salam,`,
        `*${companyName}*`
    ];

    if (!isPremium) {
        lines.push('', '────────────────────', isEn ? 'Generated via https://myinvoice.space (Free Version)' : 'Dibuat otomatis via https://myinvoice.space (Versi Gratis)');
    }

    const msg = lines.join('\n');

    const cleanPhone = (phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}
