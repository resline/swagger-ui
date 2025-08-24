import React, { lazy, Suspense } from "react"
import PropTypes from "prop-types"
import { prefersReducedMotion, getMotionClasses } from "../../utils/motion-preferences"

// Loading component for models section
const ModelsLoadingSpinner = () => {
  const reducedMotion = prefersReducedMotion()
  const containerClass = getMotionClasses("models-loading-container", "", "reduced-motion")
  
  return (
    <div className={containerClass}>
      <div className="models-spinner">
        <div className={getMotionClasses("spinner", "", "static-spinner")} />
      </div>
      <div className="loading-text">Loading schema models...</div>
      {reducedMotion && (
        <div className="loading-indicator" aria-live="polite">
          <span>●●●</span>
        </div>
      )}
    </div>
  )
}

// Lazy load the Models component from json-schema-5 plugin
const LazyModelsComponent = lazy(() =>
  import("../../plugins/json-schema-5/components/models.jsx").then(module => ({ 
    default: module.default 
  }))
)

const LazyModels = (props) => (
  <Suspense fallback={<ModelsLoadingSpinner />}>
    <LazyModelsComponent {...props} />
  </Suspense>
)

LazyModels.propTypes = {
  specSelectors: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  layoutSelectors: PropTypes.object.isRequired,
  layoutActions: PropTypes.object.isRequired,
  getConfigs: PropTypes.func.isRequired,
}

export default LazyModels