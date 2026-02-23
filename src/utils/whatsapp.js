/**
 * Generates a pre-filled WhatsApp message and opens wa.me link.
 *
 * @param {object} params
 * @param {string} params.clientName
 * @param {string} params.docType      - 'Invoice' | 'Kwitansi' | 'Tanda Terima' | 'Penawaran' | 'Purchase Order'
 * @param {string} params.docNumber
 * @param {string} params.date
 * @param {number} params.total
 * @param {object} params.company      - company_profile object { name, phone, email }
 * @param {'ID'|'EN'} params.lang
 */
export function shareWhatsApp({ clientName, docType, docNumber, date, total, company, lang }) {
    const companyName = company?.name || 'My Invoice';
    const companyPhone = company?.phone || '';
    const formattedTotal = new Intl.NumberFormat('id-ID').format(total || 0);

    let msg;
    if (lang === 'ID') {
        msg =
            `Halo ${clientName},

Berikut ${docType} dari ${companyName}:

Nomor: ${docNumber}
Tanggal: ${date}
Total: Rp ${formattedTotal}

Silakan hubungi kami jika ada pertanyaan.

${companyName}${companyPhone ? '\n' + companyPhone : ''}`;
    } else {
        msg =
            `Hello ${clientName},

Please find your ${docType} from ${companyName}:

Number: ${docNumber}
Date: ${date}
Total: Rp ${formattedTotal}

Please contact us for any questions.

${companyName}${companyPhone ? '\n' + companyPhone : ''}`;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
