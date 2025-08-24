import React, { lazy, Suspense } from "react"
import PropTypes from "prop-types"
import { prefersReducedMotion, getMotionClasses } from "../../utils/motion-preferences"

// Loading component for responses section
const ResponsesLoadingSpinner = () => {
  const reducedMotion = prefersReducedMotion()
  const containerClass = getMotionClasses("responses-loading-container", "", "reduced-motion")
  
  return (
    <div className={containerClass}>
      <div className="responses-spinner">
        <div className={getMotionClasses("spinner", "", "static-spinner")} />
      </div>
      <div className="loading-text">Loading response details...</div>
      {reducedMotion && (
        <div className="loading-indicator" aria-live="polite">
          <span>⬇</span>
        </div>
      )}
    </div>
  )
}

// Lazy load the Responses component
const LazyResponsesComponent = lazy(() =>
  import("../responses.jsx").then(module => ({ default: module.default }))
)

const LazyResponses = (props) => (
  <Suspense fallback={<ResponsesLoadingSpinner />}>
    <LazyResponsesComponent {...props} />
  </Suspense>
)

LazyResponses.propTypes = {
  responses: PropTypes.object,
  request: PropTypes.object,
  tryItOutResponse: PropTypes.object,
  getComponent: PropTypes.func.isRequired,
  getConfigs: PropTypes.func.isRequired,
  specSelectors: PropTypes.object.isRequired,
  oas3Actions: PropTypes.object.isRequired,
  oas3Selectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  produces: PropTypes.object,
  producesValue: PropTypes.any,
  specPath: PropTypes.object.isRequired,
  path: PropTypes.string.isRequired,
  method: PropTypes.string.isRequired,
  displayRequestDuration: PropTypes.bool,
  fn: PropTypes.object.isRequired
}

export default LazyResponses