import { trackEvent } from './analytics';

/**
 * Generates a pre-filled WhatsApp message and opens wa.me link.
 * Supports 4 smart follow-up modes:
 * - 'standard'  : Standard new document/invoice delivery
 * - 'reminder'  : Polite / friendly payment reminder (Anti-Sungkan)
 * - 'overdue'   : Professional overdue payment follow-up
 * - 'thank_you' : Payment received / PAID confirmation thank-you note
 *
 * @param {object} params
 * @param {string} params.phone        - recipient phone number
 * @param {string} params.clientName   - recipient name
 * @param {string} params.docType      - 'Invoice' | 'Kwitansi' | 'Tanda Terima' | 'Penawaran' | 'Purchase Order'
 * @param {string} params.docNumber
 * @param {string} params.date
 * @param {string} [params.dueDate]
 * @param {number} params.total
 * @param {object} params.company      - company_profile object { name, phone, email }
 * @param {function} params.t          - translation function
 * @param {boolean} [params.isPremium] - true for PRO / Ultimate (100% White-Label)
 * @param {string} [params.mode]       - 'standard' | 'reminder' | 'overdue' | 'thank_you'
 */
export function shareWhatsApp({
    phone,
    clientName,
    docType,
    docNumber,
    date,
    dueDate,
    total,
    company,
    t,
    isPremium = false,
    mode = 'standard',
    publicUrl = ''
}) {
    const isEn = t('locale_code') === 'en-US';
    const companyName = company?.full_name || company?.company_name || company?.name || (isEn ? 'Our Store' : 'Toko Kami');
    const formattedTotal = new Intl.NumberFormat(t('locale_code')).format(total || 0);
    const recipient = clientName && clientName !== '-' ? clientName : (isEn ? 'Valued Client' : 'Bapak/Ibu');

    let lines = [];

    if (mode === 'reminder') {
        lines = [
            isEn
                ? `Hello ${recipient}, hope your week is going well.`
                : `Halo ${recipient}, semoga sehat dan lancar selalu aktivitasnya.`,
            '',
            isEn
                ? `This is a friendly reminder regarding the following ${docType} from *${companyName}*:`
                : `Kami ingin sekadar mengingatkan kembali dengan hormat terkait ${docType} dari *${companyName}* berikut:`,
            '',
            `${t('wa_doc_num')}: ${docNumber}`,
            `${t('wa_doc_date')}: ${date}`,
            ...(dueDate ? [`${isEn ? 'Due Date' : 'Jatuh Tempo'}: ${dueDate}`] : []),
            `${t('wa_doc_total')}: *Rp ${formattedTotal}*`,
            '',
            isEn
                ? `If payment has already been made, please kindly disregard this message or share the transfer receipt so we can mark it as PAID. Thank you very much for your cooperation.`
                : `Apabila pembayaran sudah dilakukan, mohon abaikan pesan ini atau kirimkan bukti transfer agar dapat segera kami bukukan sebagai LUNAS. Terima kasih banyak atas kerja samanya.`,
            '',
            isEn ? `Warm regards,` : `Salam hormat,`,
            `*${companyName}*`
        ];
    } else if (mode === 'overdue') {
        lines = [
            isEn ? `Dear ${recipient},` : `Yth. ${recipient},`,
            '',
            isEn
                ? `Following up on our accounting records at *${companyName}*, please be advised that the following ${docType} has passed its payment due date:`
                : `Menindaklanjuti catatan pembukuan *${companyName}*, kami informasikan dengan hormat bahwa ${docType} berikut telah melewati batas waktu jatuh tempo pembayaran:`,
            '',
            `${t('wa_doc_num')}: ${docNumber}`,
            `${t('wa_doc_date')}: ${date}`,
            ...(dueDate ? [`${isEn ? 'Due Date' : 'Jatuh Tempo'}: ${dueDate}`] : []),
            `${isEn ? 'Outstanding Balance' : 'Total Belum Terbayar'}: *Rp ${formattedTotal}*`,
            '',
            isEn
                ? `We kindly request your confirmation regarding the payment schedule so our services and partnership can proceed smoothly. Thank you for your prompt attention.`
                : `Mohon kesediaannya untuk memberikan konfirmasi jadwal penyelesaian pembayaran agar kerja sama dan layanan dapat terus berjalan lancar. Terima kasih atas perhatiannya.`,
            '',
            isEn ? `Sincerely,` : `Hormat kami,`,
            `*${companyName}*`
        ];
    } else if (mode === 'thank_you') {
        lines = [
            isEn ? `Hello ${recipient},` : `Halo ${recipient},`,
            '',
            isEn
                ? `Thank you very much! Your payment to *${companyName}* has been received and recorded as *PAID IN FULL*:`
                : `Terima kasih banyak! Pembayaran Anda kepada *${companyName}* telah kami terima dan tercatat *LUNAS*:`,
            '',
            `${t('wa_doc_num')}: ${docNumber}`,
            `${isEn ? 'Amount Paid' : 'Total Pembayaran'}: *Rp ${formattedTotal}*`,
            `Status: *${isEn ? 'PAID IN FULL' : 'LUNAS'}*`,
            '',
            isEn
                ? `We truly appreciate your trust and partnership. Looking forward to serving you again!`
                : `Terima kasih atas kepercayaan dan kerja sama yang luar biasa. Kami siap membantu kebutuhan Anda berikutnya!`,
            '',
            isEn ? `Warm regards,` : `Salam hangat,`,
            `*${companyName}*`
        ];
    } else {
        lines = [
            `${t('wa_hello')} ${clientName || ''},`,
            isEn ? `Here is your ${docType} from ${companyName}.` : `Berikut kami kirimkan ${docType} dari ${companyName}.`,
            '',
            `${t('wa_doc_num')}: ${docNumber}`,
            `${t('wa_doc_date')}: ${date}`,
            ...(dueDate ? [`${isEn ? 'Due Date' : 'Jatuh Tempo'}: ${dueDate}`] : []),
            `${t('wa_doc_total')}: Rp ${formattedTotal}`,
            '',
            t('wa_contact_us'),
            '',
            isEn ? `Regards,` : `Salam,`,
            `*${companyName}*`
        ];
    }

    if (publicUrl) {
        const linkLabel = mode === 'thank_you' 
            ? (isEn ? 'View Paid Invoice Online' : 'Lihat Faktur Lunas Online')
            : (isEn ? 'View & Pay Online' : 'Lihat & Bayar Faktur Online');
        lines.push('', `${linkLabel}: ${publicUrl}`);
    }

    if (!isPremium) {
        lines.push('', '────────────────────', isEn ? 'Generated via https://myinvoice.space (Free Version)' : 'Dibuat otomatis via https://myinvoice.space (Versi Gratis)');
    }

    trackEvent('wa_viral_share', {
        tool: docType || 'document',
        mode,
        is_premium: !!isPremium
    });

    const msg = lines.join('\n');
    const cleanPhone = (phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}
