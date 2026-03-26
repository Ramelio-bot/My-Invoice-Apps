import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * Check if the application is running in a native environment (Android/iOS)
 * @returns {boolean}
 */
export const isNative = () => Capacitor.getPlatform() !== 'web';

/**
 * Get current platform identifier ('web', 'android', or 'ios')
 * @returns {string}
 */
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Wrapper for getting detailed device information
 * @returns {Promise<import('@capacitor/device').DeviceInfo>}
 */
export const getDeviceInfo = async () => {
  if (isNative()) {
    return await Device.getInfo();
  }
  return { platform: 'web', model: 'Browser', operatingSystem: 'unknown' };
};

/**
 * Execute a function only if on a native platform
 * @param {Function} callback 
 */
export const runNative = (callback) => {
  if (isNative()) {
    callback();
  }
};
