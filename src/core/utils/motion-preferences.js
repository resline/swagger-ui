/**
 * Motion Preferences Utility
 * Handles detection and management of user motion preferences for accessibility
 * Supports both system-level preferences and manual user overrides
 * WCAG 2.1 compliance for vestibular disorder accommodation
 */

// Constants
const STORAGE_KEY = "swagger-ui-motion-preference"
const MOTION_ATTRIBUTE = "data-reduced-motion"
const ANNOUNCEMENT_CLASS = "motion-preference-announcement"

/**
 * Detects if the user prefers reduced motion
 * Checks both system preference and manual override
 * @returns {boolean} True if reduced motion is preferred
 */
export function prefersReducedMotion() {
  // Check manual override first
  const manualPreference = getManualMotionPreference()
  if (manualPreference !== null) {
    return manualPreference
  }
  
  // Check system preference
  return getSystemMotionPreference()
}

/**
 * Gets system-level motion preference
 * @returns {boolean} True if system prefers reduced motion
 */
export function getSystemMotionPreference() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false
  }
  
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Gets manual motion preference from localStorage
 * @returns {boolean|null} True/false for manual preference, null if not set
 */
export function getManualMotionPreference() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === null) return null
  
  try {
    return JSON.parse(stored)
  } catch (e) {
    console.warn("Invalid motion preference in localStorage:", e)
    return null
  }
}

/**
 * Sets manual motion preference
 * @param {boolean} prefersReduced - True to prefer reduced motion
 */
export function setManualMotionPreference(prefersReduced) {
  if (typeof window === "undefined" || !window.localStorage) {
    return
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefersReduced))
    applyMotionPreference()
    announceMotionPreferenceChange(prefersReduced)
  } catch (e) {
    console.error("Failed to save motion preference:", e)
  }
}

/**
 * Clears manual motion preference, falling back to system preference
 */
export function clearManualMotionPreference() {
  if (typeof window === "undefined" || !window.localStorage) {
    return
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    applyMotionPreference()
    announceMotionPreferenceChange(getSystemMotionPreference(), true)
  } catch (e) {
    console.error("Failed to clear motion preference:", e)
  }
}

/**
 * Applies motion preference to the document
 */
export function applyMotionPreference() {
  if (typeof document === "undefined") {
    return
  }
  
  const shouldReduceMotion = prefersReducedMotion()
  const rootElement = document.documentElement
  
  if (shouldReduceMotion) {
    rootElement.setAttribute(MOTION_ATTRIBUTE, "true")
  } else {
    rootElement.removeAttribute(MOTION_ATTRIBUTE)
  }
}

/**
 * Initializes motion preference system
 * Sets up system preference listener and applies initial preference
 */
export function initializeMotionPreferences() {
  if (typeof window === "undefined") {
    return
  }
  
  // Apply initial preference
  applyMotionPreference()
  
  // Listen for system preference changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => {
      // Only react to system changes if no manual preference is set
      if (getManualMotionPreference() === null) {
        applyMotionPreference()
      }
    }
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange)
      }
    }
  }
}

/**
 * Gets motion preference status for components
 * @returns {object} Object with preference details
 */
export function getMotionPreferenceStatus() {
  return {
    reducedMotion: prefersReducedMotion(),
    systemPreference: getSystemMotionPreference(),
    manualOverride: getManualMotionPreference(),
    source: getManualMotionPreference() !== null ? "manual" : "system"
  }
}

/**
 * Hook for React components to use motion preferences
 * @param {function} callback - Optional callback when preference changes
 * @returns {object} Motion preference status
 */
export function useMotionPreference(callback) {
  if (typeof window === "undefined") {
    return {
      reducedMotion: false,
      systemPreference: false,
      manualOverride: null,
      source: "system",
      setPreference: () => {},
      clearPreference: () => {}
    }
  }
  
  const status = getMotionPreferenceStatus()
  
  return {
    ...status,
    setPreference: (prefersReduced) => {
      setManualMotionPreference(prefersReduced)
      if (callback) callback(getMotionPreferenceStatus())
    },
    clearPreference: () => {
      clearManualMotionPreference()
      if (callback) callback(getMotionPreferenceStatus())
    }
  }
}

/**
 * Utility for components to conditionally apply animations
 * @param {object} config - Animation configuration
 * @param {string} config.animation - CSS animation value
 * @param {string} config.transition - CSS transition value
 * @param {string} config.reducedAnimation - Alternative animation for reduced motion
 * @param {string} config.reducedTransition - Alternative transition for reduced motion
 * @returns {object} CSS properties object
 */
export function getAnimationStyles(config = {}) {
  const shouldReduceMotion = prefersReducedMotion()
  const {
    animation,
    transition,
    reducedAnimation = "none",
    reducedTransition = "none"
  } = config
  
  if (shouldReduceMotion) {
    return {
      animation: reducedAnimation,
      transition: reducedTransition,
      animationDuration: "0.01ms",
      transitionDuration: "0.01ms"
    }
  }
  
  return {
    animation: animation || undefined,
    transition: transition || undefined
  }
}

/**
 * Announces motion preference changes to screen readers
 * @param {boolean} prefersReduced - Current preference
 * @param {boolean} isSystemChange - Whether this is a system preference change
 */
function announceMotionPreferenceChange(prefersReduced, isSystemChange = false) {
  if (typeof document === "undefined") {
    return
  }
  
  // Create or find announcement element
  let announcement = document.querySelector(`.${ANNOUNCEMENT_CLASS}`)
  if (!announcement) {
    announcement = document.createElement("div")
    announcement.className = ANNOUNCEMENT_CLASS
    announcement.setAttribute("aria-live", "polite")
    announcement.setAttribute("aria-atomic", "true")
    document.body.appendChild(announcement)
  }
  
  // Announce the change
  const source = isSystemChange ? "System" : "Manual"
  const action = prefersReduced ? "enabled" : "disabled"
  announcement.textContent = `${source} reduced motion preference ${action}. Animations and transitions have been adjusted accordingly.`
  
  // Clear announcement after a delay
  setTimeout(() => {
    if (announcement) {
      announcement.textContent = ""
    }
  }, 1000)
}

/**
 * Provides CSS class names based on motion preference
 * @param {string} baseClass - Base CSS class
 * @param {string} motionClass - Additional class when motion is enabled
 * @param {string} reducedClass - Additional class when motion is reduced
 * @returns {string} Combined CSS class string
 */
export function getMotionClasses(baseClass, motionClass = "", reducedClass = "reduced-motion") {
  const classes = [baseClass]
  
  if (prefersReducedMotion()) {
    if (reducedClass) classes.push(reducedClass)
  } else {
    if (motionClass) classes.push(motionClass)
  }
  
  return classes.filter(Boolean).join(" ")
}

/**
 * Validates if an animation should be applied
 * @param {object} options - Validation options
 * @param {boolean} options.essential - Whether the animation is essential for functionality
 * @param {boolean} options.respectOverride - Whether to respect manual override
 * @returns {boolean} True if animation should be applied
 */
export function shouldAnimate(options = {}) {
  const { essential = false, respectOverride = true } = options
  const reducedMotion = prefersReducedMotion()
  
  // Essential animations can still run in reduced motion mode
  if (essential) {
    return true
  }
  
  // Respect motion preference
  return !reducedMotion
}

// Default export with main utilities
export default {
  prefersReducedMotion,
  getSystemMotionPreference,
  getManualMotionPreference,
  setManualMotionPreference,
  clearManualMotionPreference,
  applyMotionPreference,
  initializeMotionPreferences,
  getMotionPreferenceStatus,
  useMotionPreference,
  getAnimationStyles,
  getMotionClasses,
  shouldAnimate
}