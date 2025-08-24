/**
 * Example: How to use Performance Monitoring in Swagger UI
 * 
 * This file demonstrates how to integrate performance monitoring
 * into your custom Swagger UI components.
 */

import React, { useEffect, useState } from 'react'
import { 
  getWebVitalsTracker, 
  useRenderTime, 
  useComponentPerformance,
  usePerformanceDetector,
  useBundlePerformance
} from 'core/utils'

// Example 1: Basic component with render time tracking
const MyOperationsComponent = ({ operations }) => {
  // Track render performance
  useRenderTime('MyOperationsComponent')
  
  return (
    <div className="my-operations">
      {operations.map((op, index) => (
        <div key={index} className="operation-item">
          {op.summary}
        </div>
      ))}
    </div>
  )
}

// Example 2: Component with comprehensive performance tracking
const PerformanceAwareComponent = ({ data }) => {
  const metrics = useComponentPerformance('PerformanceAwareComponent')
  const [loadingData, setLoadingData] = useState(true)
  
  useEffect(() => {
    const webVitals = getWebVitalsTracker()
    
    // Track custom async operation
    const loadData = async () => {
      const startTime = performance.now()
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLoadingData(false)
        
        // Track the operation
        webVitals.trackCustomMetric('data-load-time', performance.now() - startTime)
      } catch (error) {
        webVitals.trackCustomMetric('data-load-error', performance.now() - startTime)
      }
    }
    
    loadData()
  }, [])
  
  if (loadingData) {
    return <div className="loading">Loading data...</div>
  }
  
  return (
    <div className="performance-aware">
      <h2>Data Loaded Successfully</h2>
      {process.env.NODE_ENV === 'development' && (
        <div className="performance-info">
          <p>Mount Time: {metrics.mountTime?.toFixed(2)}ms</p>
          <p>Last Render: {metrics.lastRenderTime?.toFixed(2)}ms</p>
          <p>Average Render: {metrics.averageRenderTime?.toFixed(2)}ms</p>
          <p>Total Renders: {metrics.totalRenders}</p>
        </div>
      )}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

// Example 3: Performance monitoring dashboard
const PerformanceDashboard = () => {
  const performanceIssues = usePerformanceDetector()
  const bundleMetrics = useBundlePerformance()
  const [vitals, setVitals] = useState({})
  
  useEffect(() => {
    const webVitals = getWebVitalsTracker()
    
    // Subscribe to Core Web Vitals updates
    webVitals.onLCP(metric => setVitals(prev => ({ ...prev, lcp: metric })))
    webVitals.onFID(metric => setVitals(prev => ({ ...prev, fid: metric })))
    webVitals.onCLS(metric => setVitals(prev => ({ ...prev, cls: metric })))
    
    // Get initial vitals
    setVitals(webVitals.getVitals())
  }, [])
  
  return (
    <div className="performance-dashboard">
      <h2>Performance Dashboard</h2>
      
      {/* Core Web Vitals */}
      <section className="web-vitals">
        <h3>Core Web Vitals</h3>
        <div className="vitals-grid">
          <div className={`vital-item ${vitals.lcp?.rating || 'unknown'}`}>
            <h4>LCP</h4>
            <p>{vitals.lcp?.value?.toFixed(0)}ms</p>
            <small>{vitals.lcp?.rating}</small>
          </div>
          <div className={`vital-item ${vitals.fid?.rating || 'unknown'}`}>
            <h4>FID</h4>
            <p>{vitals.fid?.value?.toFixed(0)}ms</p>
            <small>{vitals.fid?.rating}</small>
          </div>
          <div className={`vital-item ${vitals.cls?.rating || 'unknown'}`}>
            <h4>CLS</h4>
            <p>{vitals.cls?.value?.toFixed(3)}</p>
            <small>{vitals.cls?.rating}</small>
          </div>
        </div>
      </section>
      
      {/* Bundle Metrics */}
      {bundleMetrics && (
        <section className="bundle-metrics">
          <h3>Bundle Performance</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <h4>JS Bundle Size</h4>
              <p>{(bundleMetrics.totalJSSize / 1024).toFixed(1)} KB</p>
            </div>
            <div className="metric-item">
              <h4>CSS Bundle Size</h4>
              <p>{(bundleMetrics.totalCSSSize / 1024).toFixed(1)} KB</p>
            </div>
            <div className="metric-item">
              <h4>JS Load Time</h4>
              <p>{bundleMetrics.jsLoadTime.toFixed(0)}ms</p>
            </div>
            <div className="metric-item">
              <h4>Total Requests</h4>
              <p>{bundleMetrics.totalRequests}</p>
            </div>
          </div>
        </section>
      )}
      
      {/* Performance Issues */}
      {performanceIssues.length > 0 && (
        <section className="performance-issues">
          <h3>Performance Issues</h3>
          {performanceIssues.map((issue, index) => (
            <div key={index} className={`issue-item severity-${issue.severity}`}>
              <h4>{issue.type} Issue</h4>
              <p>{issue.message}</p>
              <small><strong>Suggestion:</strong> {issue.suggestion}</small>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

// Example 4: HOC for automatic performance tracking
const withPerformanceTracking = (WrappedComponent, componentName) => {
  return function PerformanceTrackedComponent(props) {
    const webVitals = getWebVitalsTracker()
    
    useEffect(() => {
      const startTime = performance.now()
      return () => {
        const endTime = performance.now()
        webVitals.trackCustomMetric(`${componentName}-total-time`, endTime - startTime)
      }
    }, [])
    
    useRenderTime(componentName)
    
    return <WrappedComponent {...props} />
  }
}

// Usage of HOC
const TrackedOperations = withPerformanceTracking(MyOperationsComponent, 'Operations')

// Example 5: Custom hook for API call tracking
const useTrackedAPICall = (url, options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const webVitals = getWebVitalsTracker()
  
  const makeRequest = async () => {
    setLoading(true)
    setError(null)
    
    const startTime = performance.now()
    
    try {
      const response = await fetch(url, options)
      const result = await response.json()
      
      // Track successful API call
      webVitals.trackAPICallTime(url, startTime)
      webVitals.trackCustomMetric(`api-response-size`, 
        JSON.stringify(result).length, 'bytes')
      
      setData(result)
    } catch (err) {
      // Track failed API call
      webVitals.trackCustomMetric(`api-error-${url}`, performance.now() - startTime)
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  
  return { data, loading, error, makeRequest }
}

// Example 6: Performance-aware lazy loading
const LazyComponentWithPerformance = React.lazy(() => {
  const startTime = performance.now()
  
  return import('./SomeHeavyComponent').then(module => {
    const webVitals = getWebVitalsTracker()
    webVitals.trackCustomMetric('lazy-component-load-time', performance.now() - startTime)
    return module
  })
})

// Usage in app
const App = () => {
  return (
    <div className="swagger-ui-app">
      {/* Performance dashboard (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceDashboard />
      )}
      
      {/* Regular components with performance tracking */}
      <PerformanceAwareComponent data={{ example: 'data' }} />
      
      {/* Lazy loaded component with performance tracking */}
      <React.Suspense fallback={<div>Loading heavy component...</div>}>
        <LazyComponentWithPerformance />
      </React.Suspense>
      
      {/* HOC wrapped component */}
      <TrackedOperations operations={[]} />
    </div>
  )
}

export default App

/**
 * CSS for the performance dashboard (add to your styles)
 */
const performanceDashboardStyles = `
.performance-dashboard {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 12px;
}

.vitals-grid, .metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.vital-item, .metric-item {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  border-left: 4px solid #ccc;
}

.vital-item.good { border-left-color: #28a745; }
.vital-item.needs-improvement { border-left-color: #ffc107; }
.vital-item.poor { border-left-color: #dc3545; }

.issue-item {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  border-left: 4px solid #ccc;
}

.issue-item.severity-high { border-left-color: #dc3545; }
.issue-item.severity-medium { border-left-color: #ffc107; }
.issue-item.severity-low { border-left-color: #17a2b8; }
`