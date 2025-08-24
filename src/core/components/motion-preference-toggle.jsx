import React, { useState, useEffect } from "react"
import PropTypes from "prop-types"
import {
  getMotionPreferenceStatus,
  setManualMotionPreference,
  clearManualMotionPreference
} from "../utils/motion-preferences"

const MotionPreferenceToggle = ({ className = "", showLabel = true, compact = false }) => {
  const [motionStatus, setMotionStatus] = useState(getMotionPreferenceStatus())

  useEffect(() => {
    // Update status when preferences change
    const updateStatus = () => {
      setMotionStatus(getMotionPreferenceStatus())
    }

    // Listen for storage changes (when preference is changed in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "swagger-ui-motion-preference") {
        updateStatus()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    
    // Listen for system preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      const handleMediaChange = () => {
        if (motionStatus.manualOverride === null) {
          updateStatus()
        }
      }

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleMediaChange)
        return () => {
          window.removeEventListener("storage", handleStorageChange)
          mediaQuery.removeEventListener("change", handleMediaChange)
        }
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [motionStatus.manualOverride])

  const handleToggle = (event) => {
    const isChecked = event.target.checked
    
    if (isChecked) {
      // User wants to enable reduced motion
      setManualMotionPreference(true)
    } else {
      // User wants to disable reduced motion override
      clearManualMotionPreference()
    }
    
    setMotionStatus(getMotionPreferenceStatus())
  }

  const isChecked = motionStatus.reducedMotion
  const isSystemPreference = motionStatus.source === "system"

  if (compact) {
    return (
      <div className={`motion-preference-toggle motion-toggle-compact ${className}`}>
        <input
          type="checkbox"
          id="motion-preference-toggle"
          checked={isChecked}
          onChange={handleToggle}
          aria-describedby="motion-preference-help"
        />
        <label htmlFor="motion-preference-toggle" title="Toggle reduced motion preference">
          {isChecked ? "🐌" : "🏃"}
        </label>
        <div id="motion-preference-help" className="sr-only">
          {isChecked 
            ? "Reduced motion is enabled. Animations and transitions are minimized." 
            : "Normal motion is enabled. Animations and transitions are active."}
        </div>
      </div>
    )
  }

  return (
    <div className={`motion-preference-toggle ${className}`}>
      <div className="motion-toggle-control">
        <input
          type="checkbox"
          id="motion-preference-toggle"
          checked={isChecked}
          onChange={handleToggle}
          aria-describedby="motion-preference-help"
        />
        {showLabel && (
          <label htmlFor="motion-preference-toggle">
            Reduce motion
          </label>
        )}
      </div>
      
      <div className="motion-preference-status">
        <small>
          {isSystemPreference ? (
            <span>
              Following system preference
              {motionStatus.systemPreference ? " (reduced motion)" : " (normal motion)"}
            </span>
          ) : (
            <span>
              Manual override: {motionStatus.reducedMotion ? "reduced motion" : "normal motion"}
            </span>
          )}
        </small>
      </div>
      
      <div id="motion-preference-help" className="motion-preference-help">
        <small>
          {isChecked 
            ? "Animations and transitions are minimized to reduce motion sensitivity." 
            : "Animations and transitions are enabled for enhanced visual feedback."}
          {" "}This setting helps users with vestibular disorders or motion sensitivity.
        </small>
      </div>
      
      {!isSystemPreference && (
        <button
          type="button"
          className="motion-preference-reset"
          onClick={() => {
            clearManualMotionPreference()
            setMotionStatus(getMotionPreferenceStatus())
          }}
          title="Reset to system preference"
        >
          Reset to system
        </button>
      )}
    </div>
  )
}

MotionPreferenceToggle.propTypes = {
  className: PropTypes.string,
  showLabel: PropTypes.bool,
  compact: PropTypes.bool
}

MotionPreferenceToggle.defaultProps = {
  className: "",
  showLabel: true,
  compact: false
}

export default MotionPreferenceToggle