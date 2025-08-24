/**
 * Secure Storage Utility
 * Provides secure storage for sensitive data with basic obfuscation and fallback mechanisms
 */

const STORAGE_PREFIX = "swagger_ui_"
const OBFUSCATION_KEY = "swagger_ui_obfuscate_v1"

/**
 * Simple obfuscation using base64 encoding and XOR
 * Note: This is not cryptographically secure but provides basic data obfuscation
 */
function obfuscate(data, key = OBFUSCATION_KEY) {
  try {
    const jsonString = JSON.stringify(data)
    let obfuscated = ""
    
    for (let i = 0; i < jsonString.length; i++) {
      const charCode = jsonString.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      obfuscated += String.fromCharCode(charCode)
    }
    
    return btoa(obfuscated)
  } catch (e) {
    console.warn("Obfuscation failed, storing as plain text:", e)
    return JSON.stringify(data)
  }
}

/**
 * Simple deobfuscation
 */
function deobfuscate(obfuscatedData, key = OBFUSCATION_KEY) {
  try {
    const decoded = atob(obfuscatedData)
    let original = ""
    
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      original += String.fromCharCode(charCode)
    }
    
    return JSON.parse(original)
  } catch (e) {
    // Fallback: try parsing as plain JSON
    try {
      return JSON.parse(obfuscatedData)
    } catch (parseError) {
      console.warn("Deobfuscation failed:", e)
      return null
    }
  }
}

/**
 * In-memory storage for sensitive data
 */
const memoryStorage = new Map()

/**
 * Secure storage implementation with multiple fallback layers
 */
class SecureStorage {
  constructor() {
    this.storageAvailable = this.checkStorageAvailability()
    this.preferSessionStorage = true // Prefer session storage for security
  }

  /**
   * Check if storage is available and accessible
   */
  checkStorageAvailability() {
    try {
      const testKey = "__storage_test__"
      sessionStorage.setItem(testKey, "test")
      sessionStorage.removeItem(testKey)
      return true
    } catch (e) {
      console.warn("Storage not available, using memory fallback")
      return false
    }
  }

  /**
   * Get the appropriate storage mechanism
   */
  getStorage(persistent = false) {
    if (!this.storageAvailable) {
      return null
    }
    
    // For non-persistent data, prefer sessionStorage
    if (!persistent) {
      try {
        return sessionStorage
      } catch (e) {
        console.warn("sessionStorage not available, trying localStorage")
      }
    }
    
    // Fallback to localStorage only for persistent data
    try {
      return localStorage
    } catch (e) {
      console.warn("localStorage not available")
      return null
    }
  }

  /**
   * Store obfuscated data
   */
  setItem(key, value, options = {}) {
    const { persistent = false, encrypted = true } = options
    const prefixedKey = STORAGE_PREFIX + key
    
    let processedValue = value
    if (encrypted) {
      processedValue = obfuscate(value)
    } else {
      processedValue = JSON.stringify(value)
    }

    const storage = this.getStorage(persistent)
    
    if (storage) {
      try {
        storage.setItem(prefixedKey, processedValue)
        return true
      } catch (e) {
        console.warn(`Storage failed for key ${key}, using memory fallback:`, e)
      }
    }
    
    // Memory fallback
    memoryStorage.set(prefixedKey, processedValue)
    return true
  }

  /**
   * Retrieve and deobfuscate data
   */
  getItem(key, options = {}) {
    const { persistent = false, encrypted = true } = options
    const prefixedKey = STORAGE_PREFIX + key
    
    let storedValue = null
    
    const storage = this.getStorage(persistent)
    if (storage) {
      try {
        storedValue = storage.getItem(prefixedKey)
      } catch (e) {
        console.warn(`Storage retrieval failed for key ${key}:`, e)
      }
    }
    
    // Check memory fallback
    if (!storedValue && memoryStorage.has(prefixedKey)) {
      storedValue = memoryStorage.get(prefixedKey)
    }
    
    if (!storedValue) {
      return null
    }
    
    if (encrypted) {
      return deobfuscate(storedValue)
    } else {
      try {
        return JSON.parse(storedValue)
      } catch (e) {
        console.warn(`Failed to parse stored value for key ${key}:`, e)
        return null
      }
    }
  }

  /**
   * Remove data
   */
  removeItem(key, options = {}) {
    const { persistent = false } = options
    const prefixedKey = STORAGE_PREFIX + key
    
    const storage = this.getStorage(persistent)
    if (storage) {
      try {
        storage.removeItem(prefixedKey)
      } catch (e) {
        console.warn(`Storage removal failed for key ${key}:`, e)
      }
    }
    
    // Also remove from memory
    memoryStorage.delete(prefixedKey)
  }

  /**
   * Clear all secured data
   */
  clear() {
    // Clear from session storage
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn("Failed to clear sessionStorage:", e)
    }
    
    // Clear from local storage
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn("Failed to clear localStorage:", e)
    }
    
    // Clear memory
    Array.from(memoryStorage.keys()).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        memoryStorage.delete(key)
      }
    })
  }

  /**
   * Check if a key exists
   */
  hasItem(key, options = {}) {
    const { persistent = false } = options
    const prefixedKey = STORAGE_PREFIX + key
    
    const storage = this.getStorage(persistent)
    if (storage) {
      try {
        return storage.getItem(prefixedKey) !== null
      } catch (e) {
        console.warn(`Storage check failed for key ${key}:`, e)
      }
    }
    
    return memoryStorage.has(prefixedKey)
  }
}

// Create singleton instance
const secureStorage = new SecureStorage()

// Export singleton instance
export default secureStorage

// Named exports for specific use cases
export const authStorage = {
  setAuth: (data) => secureStorage.setItem("authorized", data, { encrypted: true, persistent: false }),
  getAuth: () => secureStorage.getItem("authorized", { encrypted: true, persistent: false }),
  removeAuth: () => secureStorage.removeItem("authorized", { persistent: false }),
  hasAuth: () => secureStorage.hasItem("authorized", { persistent: false })
}

export const configStorage = {
  setConfig: (key, data) => secureStorage.setItem(`config_${key}`, data, { encrypted: false, persistent: true }),
  getConfig: (key) => secureStorage.getItem(`config_${key}`, { encrypted: false, persistent: true }),
  removeConfig: (key) => secureStorage.removeItem(`config_${key}`, { persistent: true })
}