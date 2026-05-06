const QUEUE_KEY = 'myinvoice_offline_sales';

/**
 * Adds a transaction to the offline queue
 * @param {Object} saleData - Parameters for process_sale RPC
 * @returns {string|null} - The offline_id of the entry
 */
export const addToOfflineQueue = (saleData) => {
    try {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        const entry = {
            offline_id: `OFFLINE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            data: saleData
        };
        queue.push(entry);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        return entry.offline_id;
    } catch (err) {
        console.error('Failed to add to offline queue:', err);
        return null;
    }
};

/**
 * Retrieves all pending offline transactions
 * @returns {Array}
 */
export const getOfflineQueue = () => {
    try {
        return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch (err) {
        console.error('Failed to get offline queue:', err);
        return [];
    }
};

/**
 * Removes a specific transaction from the queue
 * @param {string} offlineId 
 */
export const removeFromOfflineQueue = (offlineId) => {
    try {
        const queue = getOfflineQueue();
        const updatedQueue = queue.filter(item => item.offline_id !== offlineId);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (err) {
        console.error('Failed to remove from offline queue:', err);
    }
};

/**
 * Clears the entire offline queue
 */
export const clearOfflineQueue = () => {
    localStorage.removeItem(QUEUE_KEY);
};
