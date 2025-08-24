/**
 * @prettier
 */
import React from "react"
import PropTypes from "prop-types"
import { getPerformanceMonitor, getWebVitalsTracker } from "core/utils"

class App extends React.Component {
  componentDidMount() {
    // Initialize performance monitoring
    const performanceMonitor = getPerformanceMonitor()
    const webVitalsTracker = getWebVitalsTracker()
    
    // Track initial bundle load and app mount
    webVitalsTracker.trackBundleSize()
    performanceMonitor.markEnd('app-mount')
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      webVitalsTracker.onLCP((metric) => {
        console.log('📊 LCP:', metric)
      })
      webVitalsTracker.onFID((metric) => {
        console.log('📊 FID:', metric)
      })
      webVitalsTracker.onCLS((metric) => {
        console.log('📊 CLS:', metric)
      })
    }
  }

  constructor(props) {
    super(props)
    // Start measuring app mount time
    const performanceMonitor = getPerformanceMonitor()
    performanceMonitor.markStart('app-mount')
  }

  getLayout() {
    const { getComponent, layoutSelectors } = this.props
    const layoutName = layoutSelectors.current()
    const Component = getComponent(layoutName, true)

    return Component
      ? Component
      : () => <h1> No layout defined for &quot;{layoutName}&quot; </h1>
  }

  render() {
    const Layout = this.getLayout()

    return <Layout />
  }
}

App.propTypes = {
  getComponent: PropTypes.func.isRequired,
  layoutSelectors: PropTypes.object.isRequired,
}

export default App
