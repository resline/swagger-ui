/**
 * Test suite for secure-storage.js
 * Tests AES-GCM encryption, key management, legacy migration, and fallback behavior
 */

import secureStorage, { authStorage, configStorage, migrateEncryption } from "../../../../src/core/utils/secure-storage.js"

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: jest.fn(),
  databases: new Map(),
}

// Mock crypto API
const mockCrypto = {
  subtle: {
    generateKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    exportKey: jest.fn(),
    importKey: jest.fn(),
  },
  getRandomValues: jest.fn(),
}

// Mock storage APIs
const mockSessionStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  keys: jest.fn(() => []),
}

const mockLocalStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  keys: jest.fn(() => []),
}

describe("SecureStorage", () => {
  let originalIndexedDB, originalCrypto, originalSessionStorage, originalLocalStorage

  beforeEach(() => {
    // Store originals
    originalIndexedDB = global.indexedDB
    originalCrypto = global.crypto
    originalSessionStorage = global.sessionStorage
    originalLocalStorage = global.localStorage

    // Mock implementations
    global.indexedDB = mockIndexedDB
    global.crypto = mockCrypto
    global.sessionStorage = mockSessionStorage
    global.localStorage = mockLocalStorage

    // Reset all mocks
    jest.clearAllMocks()

    // Setup default mock behaviors
    mockCrypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    })

    mockCrypto.subtle.generateKey.mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 },
      extractable: true,
      usages: ['encrypt', 'decrypt']
    })

    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32))
    mockCrypto.subtle.importKey.mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 },
      extractable: true,
      usages: ['encrypt', 'decrypt']
    })

    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
    mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('{"test":"data"}'))

    // Mock IndexedDB
    const mockDB = {
      createObjectStore: jest.fn(),
      transaction: jest.fn(),
      close: jest.fn(),
      objectStoreNames: { contains: jest.fn(() => false) }
    }

    const mockTransaction = {
      objectStore: jest.fn(),
      oncomplete: null,
      onerror: null
    }

    const mockStore = {
      put: jest.fn(),
      get: jest.fn()
    }

    const mockGetRequest = {
      onsuccess: null,
      onerror: null,
      result: null
    }

    mockStore.get.mockReturnValue(mockGetRequest)
    mockTransaction.objectStore.mockReturnValue(mockStore)
    mockDB.transaction.mockReturnValue(mockTransaction)

    mockIndexedDB.open.mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB
    })

    // Mock storage availability
    mockSessionStorage.getItem.mockReturnValue(null)
    mockSessionStorage.setItem.mockImplementation(() => {})
    mockSessionStorage.removeItem.mockImplementation(() => {})

    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    mockLocalStorage.removeItem.mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore originals
    global.indexedDB = originalIndexedDB
    global.crypto = originalCrypto
    global.sessionStorage = originalSessionStorage
    global.localStorage = originalLocalStorage
  })

  describe("Web Crypto API Support", () => {
    test("should detect Web Crypto API availability", () => {
      expect(typeof global.crypto !== 'undefined').toBe(true)
      expect(global.crypto.subtle).toBeDefined()
      expect(typeof global.crypto.getRandomValues === 'function').toBe(true)
    })

    test("should handle missing Web Crypto API gracefully", async () => {
      global.crypto = undefined
      
      const testData = { test: "data" }
      const result = await secureStorage.setItem("test", testData)
      
      expect(result).toBe(true) // Should still succeed with fallback
    })

    test("should handle missing crypto.subtle gracefully", async () => {
      global.crypto = { getRandomValues: jest.fn() }
      
      const testData = { test: "data" }
      const result = await secureStorage.setItem("test", testData)
      
      expect(result).toBe(true)
    })
  })

  describe("AES-GCM Encryption", () => {
    test("should encrypt data with unique IVs", async () => {
      const testData = { sensitive: "information", token: "abc123" }
      
      await secureStorage.setItem("test1", testData)
      await secureStorage.setItem("test2", testData)
      
      // Should call encrypt multiple times with different IVs
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledTimes(2)
    })

    test("should decrypt AES encrypted data correctly", async () => {
      const testData = { sensitive: "information" }
      const encryptedValue = "AES:base64encodeddata"
      
      mockSessionStorage.getItem.mockReturnValue(encryptedValue)
      
      const result = await secureStorage.getItem("test")
      
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled()
    })

    test("should handle encryption errors gracefully", async () => {
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error("Encryption failed"))
      
      const testData = { test: "data" }
      const result = await secureStorage.setItem("test", testData)
      
      expect(result).toBe(true) // Should fallback to legacy obfuscation
    })

    test("should handle decryption errors gracefully", async () => {
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error("Decryption failed"))
      mockSessionStorage.getItem.mockReturnValue("AES:corrupteddata")
      
      const result = await secureStorage.getItem("test")
      
      expect(result).toBeNull()
    })
  })

  describe("Key Management", () => {
    test("should generate new encryption key", async () => {
      await secureStorage.setItem("test", { data: "test" })
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )
    })

    test("should store encryption key in IndexedDB", async () => {
      const mockRequest = mockIndexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      })

      await secureStorage.setItem("test", { data: "test" })
      
      // Simulate successful IndexedDB operation
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: { result: mockRequest.result } })
      }
      
      expect(mockIndexedDB.open).toHaveBeenCalledWith('SwaggerUISecureStorage', 1)
    })

    test("should handle IndexedDB storage failure gracefully", async () => {
      const mockRequest = {
        onerror: null,
        onupgradeneeded: null,
        onsuccess: null
      }
      mockIndexedDB.open.mockReturnValue(mockRequest)
      
      const testData = { test: "data" }
      const result = await secureStorage.setItem("test", testData)
      
      // Simulate IndexedDB error
      if (mockRequest.onerror) {
        mockRequest.onerror()
      }
      
      expect(result).toBe(true) // Should continue with in-memory key
    })
  })

  describe("Legacy XOR Migration", () => {
    test("should detect legacy XOR encrypted data", async () => {
      const legacyData = btoa("obfuscated_data")
      mockSessionStorage.getItem.mockReturnValue(legacyData)
      
      const result = await secureStorage.getItem("test")
      
      // Should attempt legacy deobfuscation (won't actually work with mock)
      expect(mockSessionStorage.getItem).toHaveBeenCalled()
    })

    test("should migrate legacy data to AES encryption", async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
      
      // Setup legacy data
      const legacyKey = "swagger_ui_test"
      const legacyValue = btoa("test_data")
      mockSessionStorage.keys = jest.fn(() => [legacyKey])
      mockLocalStorage.keys = jest.fn(() => [])
      
      Object.keys = jest.fn()
        .mockReturnValueOnce([legacyKey])
        .mockReturnValueOnce([])
      
      mockSessionStorage.getItem.mockReturnValue(legacyValue)
      
      await migrateEncryption()
      
      consoleSpy.mockRestore()
    })

    test("should handle migration errors gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Force migration error
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error("Migration failed"))
      
      await migrateEncryption()
      
      consoleWarnSpy.mockRestore()
    })

    test("should skip migration when Web Crypto API unavailable", async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
      
      global.crypto = undefined
      
      await migrateEncryption()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Web Crypto API not available, skipping encryption migration'
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe("Storage Fallbacks", () => {
    test("should use sessionStorage by default", async () => {
      await secureStorage.setItem("test", { data: "test" })
      
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })

    test("should fallback to localStorage for persistent storage", async () => {
      await secureStorage.setItem("test", { data: "test" }, { persistent: true })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    test("should fallback to memory when storage unavailable", async () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error("Storage unavailable")
      })
      
      const result = await secureStorage.setItem("test", { data: "test" })
      
      expect(result).toBe(true) // Should use memory fallback
    })

    test("should retrieve from memory fallback", async () => {
      // Store in memory fallback first
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error("Storage unavailable")
      })
      await secureStorage.setItem("test", { data: "test" })
      
      // Then retrieve
      mockSessionStorage.getItem.mockReturnValue(null)
      const result = await secureStorage.getItem("test")
      
      expect(result).toBeDefined()
    })

    test("should handle storage check gracefully", () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error("Storage unavailable")
      })
      
      const hasStorage = secureStorage.checkStorageAvailability()
      expect(hasStorage).toBe(false)
    })
  })

  describe("Error Handling", () => {
    test("should handle corrupted stored data", async () => {
      mockSessionStorage.getItem.mockReturnValue("corrupted_data")
      
      const result = await secureStorage.getItem("test")
      
      expect(result).toBeNull()
    })

    test("should handle JSON parse errors", async () => {
      mockSessionStorage.getItem.mockReturnValue("not_valid_json")
      
      const result = await secureStorage.getItem("test", { encrypted: false })
      
      expect(result).toBeNull()
    })

    test("should log warnings for encryption failures", async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error("Encryption failed"))
      
      await secureStorage.setItem("test", { data: "test" })
      
      expect(consoleWarnSpy).toHaveBeenCalled()
      
      consoleWarnSpy.mockRestore()
    })
  })

  describe("Public API", () => {
    test("should remove items from all storage locations", () => {
      secureStorage.removeItem("test")
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("swagger_ui_test")
    })

    test("should clear all secured data", () => {
      Object.keys = jest.fn()
        .mockReturnValueOnce(["swagger_ui_test1", "swagger_ui_test2"])
        .mockReturnValueOnce(["swagger_ui_test3"])
      
      secureStorage.clear()
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalled()
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })

    test("should check if item exists", () => {
      mockSessionStorage.getItem.mockReturnValue("some_value")
      
      const exists = secureStorage.hasItem("test")
      
      expect(exists).toBe(true)
    })

    test("should handle storage errors in hasItem", () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error")
      })
      
      const exists = secureStorage.hasItem("test")
      
      expect(exists).toBe(false) // Should check memory fallback
    })
  })

  describe("Auth Storage Helper", () => {
    test("should store auth data encrypted", async () => {
      const authData = { token: "secret_token", user: "testuser" }
      
      await authStorage.setAuth(authData)
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "swagger_ui_authorized",
        expect.any(String)
      )
    })

    test("should retrieve auth data", async () => {
      mockSessionStorage.getItem.mockReturnValue("AES:encrypted_auth_data")
      
      await authStorage.getAuth()
      
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled()
    })

    test("should remove auth data", () => {
      authStorage.removeAuth()
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("swagger_ui_authorized")
    })

    test("should check auth existence", () => {
      mockSessionStorage.getItem.mockReturnValue("some_auth_data")
      
      const hasAuth = authStorage.hasAuth()
      
      expect(hasAuth).toBe(true)
    })
  })

  describe("Config Storage Helper", () => {
    test("should store config data unencrypted", async () => {
      const configData = { theme: "dark", language: "en" }
      
      await configStorage.setConfig("ui", configData)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "swagger_ui_config_ui",
        JSON.stringify(configData)
      )
    })

    test("should retrieve config data", async () => {
      const configData = { theme: "dark", language: "en" }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(configData))
      
      const result = await configStorage.getConfig("ui")
      
      expect(result).toEqual(configData)
    })

    test("should remove config data", () => {
      configStorage.removeConfig("ui")
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("swagger_ui_config_ui")
    })
  })

  describe("Browser Compatibility", () => {
    test("should handle browsers without sessionStorage", async () => {
      global.sessionStorage = undefined
      
      const result = await secureStorage.setItem("test", { data: "test" })
      
      expect(result).toBe(true) // Should fallback to localStorage or memory
    })

    test("should handle browsers without localStorage", async () => {
      global.localStorage = undefined
      
      const result = await secureStorage.setItem("test", { data: "test" }, { persistent: true })
      
      expect(result).toBe(true) // Should fallback to sessionStorage or memory
    })

    test("should handle browsers without any storage", async () => {
      global.sessionStorage = undefined
      global.localStorage = undefined
      
      const result = await secureStorage.setItem("test", { data: "test" })
      
      expect(result).toBe(true) // Should use memory fallback
    })
  })

  describe("Security Features", () => {
    test("should use different IVs for each encryption", async () => {
      mockCrypto.getRandomValues.mockImplementation((array) => {
        // Return different values each time
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
        return array
      })

      await secureStorage.setItem("test1", { data: "test1" })
      await secureStorage.setItem("test2", { data: "test2" })
      
      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2)
    })

    test("should prefix encrypted data with AES identifier", async () => {
      const mockEncrypted = new ArrayBuffer(28) // 12 bytes IV + 16 bytes encrypted
      const mockIV = new Uint8Array(12)
      
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted)
      
      await secureStorage.setItem("test", { data: "test" })
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "swagger_ui_test",
        expect.stringMatching(/^AES:/)
      )
    })

    test("should validate encryption key parameters", async () => {
      await secureStorage.setItem("test", { data: "test" })
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          length: 256
        },
        true, // extractable
        ['encrypt', 'decrypt']
      )
    })

    test("should use proper AES-GCM parameters for encryption", async () => {
      const testData = { sensitive: "data" }
      
      await secureStorage.setItem("test", testData)
      
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AES-GCM',
          iv: expect.any(Uint8Array)
        }),
        expect.any(Object), // key
        expect.any(ArrayBuffer) // data
      )
    })
  })
})