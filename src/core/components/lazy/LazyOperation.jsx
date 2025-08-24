import React, { lazy, Suspense } from "react"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import { List } from "immutable"
import { prefersReducedMotion, getMotionClasses } from "../../utils/motion-preferences"

// Loading component for individual operations
const OperationLoadingSpinner = () => {
  const reducedMotion = prefersReducedMotion()
  const containerClass = getMotionClasses("opblock-loading-container", "", "reduced-motion")
  
  return (
    <div className={containerClass}>
      <div className="operation-spinner">
        <div className={getMotionClasses("spinner", "", "static-spinner")} />
      </div>
      <div className="loading-text">
        {reducedMotion ? "Loading operation details..." : "Loading operation details..."}
      </div>
      {reducedMotion && (
        <div className="loading-indicator" aria-live="polite">
          <span>●</span>
        </div>
      )}
    </div>
  )
}

// Lazy load the Operation component
const LazyOperationComponent = lazy(() =>
  import("../operation.jsx").then(module => ({ default: module.default }))
)

const LazyOperation = (props) => (
  <Suspense fallback={<OperationLoadingSpinner />}>
    <LazyOperationComponent {...props} />
  </Suspense>
)

LazyOperation.propTypes = {
  specPath: ImPropTypes.list.isRequired,
  operation: PropTypes.object.isRequired,
  summary: PropTypes.string,
  response: PropTypes.object,
  request: PropTypes.object,
  toggleShown: PropTypes.func.isRequired,
  onTryoutClick: PropTypes.func.isRequired,
  onResetClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onExecute: PropTypes.func.isRequired,
  getComponent: PropTypes.func.isRequired,
  getConfigs: PropTypes.func.isRequired,
  authActions: PropTypes.object,
  authSelectors: PropTypes.object,
  specActions: PropTypes.object.isRequired,
  specSelectors: PropTypes.object.isRequired,
  oas3Actions: PropTypes.object.isRequired,
  oas3Selectors: PropTypes.object.isRequired,
  layoutActions: PropTypes.object.isRequired,
  layoutSelectors: PropTypes.object.isRequired,
  fn: PropTypes.object.isRequired
}

LazyOperation.defaultProps = {
  operation: null,
  response: null,
  request: null,
  specPath: List(),
  summary: ""
}

export default LazyOperation