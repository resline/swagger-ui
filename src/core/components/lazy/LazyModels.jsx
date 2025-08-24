import React, { lazy, Suspense } from "react"
import PropTypes from "prop-types"

// Loading component for models section
const ModelsLoadingSpinner = () => (
  <div className="models-loading-container">
    <div className="models-spinner">
      <div className="spinner" />
    </div>
    <div className="loading-text">Loading schema models...</div>
  </div>
)

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