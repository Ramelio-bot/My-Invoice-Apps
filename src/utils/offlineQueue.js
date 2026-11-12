import { openDB } from 'idb';

const DB_NAME = 'MyInvoiceOfflineDB';
const STORE_NAME = 'offline_sales';
const DB_VERSION = 1;
const QUEUE_KEY = 'myinvoice_offline_sales'; // For migration

export let isSyncing = false;
export const setIsSyncing = (val) => { isSyncing = val; };

/**
 * Opens the IndexedDB instance
 */
const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'offline_id' });
            }
        },
    });
};

/**
 * Migrates data from localStorage to IndexedDB if exists
 */
const migrateFromLocalStorage = async () => {
    try {
        const legacyData = localStorage.getItem(QUEUE_KEY);
        if (legacyData) {
            const queue = JSON.parse(legacyData);
            if (Array.isArray(queue) && queue.length > 0) {
                console.log(`[IDB] Migrating ${queue.length} items from localStorage...`);
                const db = await initDB();
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                for (const item of queue) {
                    await store.put(item);
                }
                await tx.done;
                console.log('[IDB] Migration successful.');
            }
            localStorage.removeItem(QUEUE_KEY);
        }
    } catch (err) {
        console.error('[IDB] Migration failed:', err);
    }
};

// Initial migration trigger
migrateFromLocalStorage();

const ALLOWED_PROCESS_SALE_KEYS = [
    'p_outlet_id',
    'p_user_id',
    'p_items',
    'p_total',
    'p_subtotal',
    'p_payment_method',
    'p_receipt_number',
    'p_amount_paid',
    'p_change_amount',
    'p_discount_type',
    'p_discount_value',
    'p_discount_amount',
    'p_kasir_name',
    'p_customer_phone'
];

/**
 * Strips any non-RPC keys (such as legacy idempotency_key) and ensures a deterministic receipt number
 * so PostgREST never rejects the process_sale payload and the DB idempotency trigger can deduplicate safely.
 */
export const sanitizeProcessSalePayload = (raw = {}) => {
    const clean = {};
    for (const key of ALLOWED_PROCESS_SALE_KEYS) {
        if (raw[key] !== undefined) {
            clean[key] = raw[key];
        }
    }
    if (!clean.p_receipt_number) {
        const dateStr = new Date().toLocaleDateString('en-CA').replace(/-/g, '');
        const fallbackSuffix = String(raw.idempotency_key || crypto.randomUUID()).replace(/-/g, '').slice(0, 6).toUpperCase();
        clean.p_receipt_number = `SUTRA-${dateStr}-${fallbackSuffix}`;
    }
    return clean;
};

/**
 * Adds a transaction to the offline queue with deterministic receipt-number idempotency
 * @param {Object} saleData - Parameters for process_sale RPC
 * @returns {Promise<string|null>} - The offline_id of the entry
 */
export const addToOfflineQueue = async (saleData) => {
    try {
        const db = await initDB();
        const cleanData = sanitizeProcessSalePayload(saleData);
        const receiptNum = cleanData.p_receipt_number;
        const deterministicOfflineId = `OFFLINE_${receiptNum}`;

        const entry = {
            offline_id: deterministicOfflineId,
            idempotency_key: receiptNum,
            timestamp: new Date().toISOString(),
            data: cleanData
        };
        await db.put(STORE_NAME, entry);
        return entry.offline_id;
    } catch (err) {
        console.error('Failed to add to offline queue (IDB):', err);
        return null;
    }
};

/**
 * Retrieves all pending offline transactions
 * @returns {Promise<Array>}
 */
export const getOfflineQueue = async () => {
    try {
        const db = await initDB();
        return await db.getAll(STORE_NAME);
    } catch (err) {
        console.error('Failed to get offline queue (IDB):', err);
        return [];
    }
};

/**
 * Removes a specific transaction from the queue
 * @param {string} offlineId 
 */
export const removeFromOfflineQueue = async (offlineId) => {
    try {
        const db = await initDB();
        await db.delete(STORE_NAME, offlineId);
    } catch (err) {
        console.error('Failed to remove from offline queue (IDB):', err);
    }
};

/**
 * Clears the entire offline queue
 */
export const clearOfflineQueue = async () => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await tx.objectStore(STORE_NAME).clear();
        await tx.done;
    } catch (err) {
        console.error('Failed to clear offline queue (IDB):', err);
    }
};
