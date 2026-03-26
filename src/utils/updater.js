import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { isNative } from './platform';

/**
 * Initialize Live Updates (OTA)
 * Automatically checks for updates and reloads the app if a new version is found.
 */
export async function initLiveUpdates() {
    if (!isNative()) return;

    try {
        console.log('[Updater] Initializing Live Updates...');
        
        // Listen for update events if needed, but for now we focus on the manual check
        await CapacitorUpdater.notifyAppReady();
        
        // Check for updates (Can be customized to check for a specific channel)
        // Note: For Capgo, this uses the autoUpdate configuration in capacitor.config.ts
        // If autoUpdate is false, you can manually trigger with:
        // const updateInfo = await CapacitorUpdater.getLatest();
        
        console.log('[Updater] App ready and checking for updates background.');
    } catch (error) {
        console.error('[Updater] Failed to initialize live updates:', error);
    }
}
