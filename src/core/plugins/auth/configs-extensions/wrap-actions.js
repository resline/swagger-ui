/**
 * @prettier
 */
import { authStorage } from "core/utils/secure-storage"

export const loaded = (oriAction, system) => (payload) => {
  const { getConfigs, authActions } = system
  const configs = getConfigs()

  oriAction(payload)

  // check if we should restore authorization data from secure storage
  if (configs.persistAuthorization) {
    try {
      const authorized = authStorage.getAuth()
      if (authorized) {
        authActions.restoreAuthorization({
          authorized: authorized,
        })
      }
    } catch (e) {
      console.warn("Failed to restore from secure storage, trying localStorage:", e)
      // Fallback to localStorage
      const authorized = localStorage.getItem("authorized")
      if (authorized) {
        authActions.restoreAuthorization({
          authorized: JSON.parse(authorized),
        })
      }
    }
  }
}
