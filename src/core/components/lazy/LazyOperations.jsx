import React, { lazy, Suspense } from "react"
import PropTypes from "prop-types"

// Loading component
const LoadingSpinner = () => (
  <div className="swagger-ui loading-container">
    <div className="loading-spinner">
      <div className="spinner" />
    </div>
    <div className="loading-text">Loading operations...</div>
  </div>
)

// Lazy load the Operations component
const LazyOperationsComponent = lazy(() => 
  import("../operations.jsx").then(module => ({ default: module.default }))
)

const LazyOperations = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyOperationsComponent {...props} />
  </Suspense>
)

LazyOperations.propTypes = {
  layoutActions: PropTypes.object.isRequired,
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  layoutSelectors: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  fn: PropTypes.object.isRequired,
}

export default LazyOperations