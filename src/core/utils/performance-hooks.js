/**
 * React Performance Hooks
 * Custom hooks for measuring component performance
 */

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { getWebVitalsTracker } from './web-vitals.js'

// Hook to measure component render time
export const useRenderTime = (componentName) => {
  const startTimeRef = useRef(null)
  const webVitals = getWebVitalsTracker()

  // Fixed: Added proper dependency array to prevent infinite rerenders
  useEffect(() => {
    if (startTimeRef.current) {
      const renderTime = performance.now() - startTimeRef.current
      webVitals.trackRenderTime(componentName, renderTime)
    }
  }, [componentName, webVitals])

  const startMeasurement = useCallback(() => {
    startTimeRef.current = performance.now()
  }, [])

  // Fixed: Moved side effect from render phase to useLayoutEffect
  // This ensures measurement starts before DOM mutations
  useLayoutEffect(() => {
    startMeasurement()
  }, [startMeasurement])

  return { startMeasurement }
}

// Hook to measure component mount time
export const useMountTime = (componentName) => {
  const mountStartRef = useRef(performance.now())
  const webVitals = getWebVitalsTracker()

  useEffect(() => {
    const mountTime = performance.now() - mountStartRef.current
    webVitals.trackCustomMetric(`${componentName}-mount-time`, mountTime)
  }, [componentName, webVitals])
}

// Hook to track component lifecycle performance
export const useComponentPerformance = (componentName) => {
  const [metrics, setMetrics] = useState({})
  const renderStartRef = useRef(null)
  const mountStartRef = useRef(performance.now())
  const updateCountRef = useRef(0)
  const webVitals = getWebVitalsTracker()

  // Fixed: Added proper dependency array to prevent infinite rerenders
  // Removed metrics from deps to prevent infinite loop since we're updating metrics inside
  // Track render time
  useEffect(() => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current
      setMetrics(prev => ({
        ...prev,
        lastRenderTime: renderTime,
        totalRenders: updateCountRef.current,
        averageRenderTime: (prev.averageRenderTime || 0) * 0.9 + renderTime * 0.1
      }))
      
      webVitals.trackRenderTime(componentName, renderTime)
    }
  }, [componentName, webVitals])

  // Track mount time
  useEffect(() => {
    const mountTime = performance.now() - mountStartRef.current
    setMetrics(prev => ({ ...prev, mountTime }))
    webVitals.trackCustomMetric(`${componentName}-mount-time`, mountTime)
  }, [componentName, webVitals])

  const startRender = useCallback(() => {
    renderStartRef.current = performance.now()
    updateCountRef.current += 1
  }, [])

  // Fixed: Moved side effect from render phase to useLayoutEffect
  // This ensures measurement starts before DOM mutations
  useLayoutEffect(() => {
    startRender()
  }, [startRender])

  return metrics
}

// Hook to track async operations
export const useAsyncPerformance = () => {
  const webVitals = getWebVitalsTracker()

  const trackAsync = useCallback(async (name, asyncFn) => {
    const startTime = performance.now()
    try {
      const result = await asyncFn()
      const duration = performance.now() - startTime
      webVitals.trackCustomMetric(`async-${name}`, duration)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      webVitals.trackCustomMetric(`async-${name}-error`, duration)
      throw error
    }
  }, [webVitals])

  return { trackAsync }
}

// Hook to monitor memory usage
export const useMemoryMonitor = (intervalMs = 5000) => {
  const [memoryUsage, setMemoryUsage] = useState(null)

  useEffect(() => {
    if (!performance.memory) return

    const updateMemoryUsage = () => {
      setMemoryUsage({
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      })
    }

    updateMemoryUsage()
    const interval = setInterval(updateMemoryUsage, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs])

  return memoryUsage
}

// Hook to track large list performance
export const useListPerformance = (listName, itemCount) => {
  const webVitals = getWebVitalsTracker()
  const renderStartRef = useRef(null)

  // Fixed: Added empty dependency array to run only once per component lifecycle
  useLayoutEffect(() => {
    renderStartRef.current = performance.now()
  }, [])

  useEffect(() => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current
      webVitals.trackCustomMetric(`list-${listName}-render`, renderTime)
      webVitals.trackCustomMetric(`list-${listName}-items`, itemCount, 'count')
      
      // Calculate items per millisecond
      if (renderTime > 0) {
        webVitals.trackCustomMetric(`list-${listName}-items-per-ms`, itemCount / renderTime, 'rate')
      }
    }
  }, [listName, itemCount, webVitals])
}

// Hook to detect performance issues
export const usePerformanceDetector = () => {
  const [issues, setIssues] = useState([])
  const webVitals = getWebVitalsTracker()

  useEffect(() => {
    const checkPerformance = () => {
      const vitals = webVitals.getVitals()
      const newIssues = []

      // Check LCP
      if (vitals.lcp && vitals.lcp.rating === 'poor') {
        newIssues.push({
          type: 'LCP',
          severity: 'high',
          message: `Largest Contentful Paint is ${vitals.lcp.value.toFixed(0)}ms (should be < 2500ms)`,
          suggestion: 'Optimize image loading, reduce server response times, or implement lazy loading'
        })
      }

      // Check FID
      if (vitals.fid && vitals.fid.rating === 'poor') {
        newIssues.push({
          type: 'FID',
          severity: 'high',
          message: `First Input Delay is ${vitals.fid.value.toFixed(0)}ms (should be < 100ms)`,
          suggestion: 'Reduce JavaScript execution time or split large bundles'
        })
      }

      // Check CLS
      if (vitals.cls && vitals.cls.rating === 'poor') {
        newIssues.push({
          type: 'CLS',
          severity: 'medium',
          message: `Cumulative Layout Shift is ${vitals.cls.value.toFixed(3)} (should be < 0.1)`,
          suggestion: 'Set explicit dimensions for images and containers'
        })
      }

      setIssues(newIssues)
    }

    const interval = setInterval(checkPerformance, 10000) // Check every 10 seconds
    checkPerformance() // Initial check

    return () => clearInterval(interval)
  }, [webVitals])

  return issues
}

// Hook to track bundle loading performance
export const useBundlePerformance = () => {
  const [bundleMetrics, setBundleMetrics] = useState(null)
  const webVitals = getWebVitalsTracker()

  useEffect(() => {
    const calculateBundleMetrics = () => {
      const resources = performance.getEntriesByType('resource')
      const jsResources = resources.filter(r => r.name.endsWith('.js'))
      const cssResources = resources.filter(r => r.name.endsWith('.css'))

      const metrics = {
        totalJSSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        totalCSSSize: cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        jsLoadTime: jsResources.reduce((max, r) => Math.max(max, r.duration || 0), 0),
        cssLoadTime: cssResources.reduce((max, r) => Math.max(max, r.duration || 0), 0),
        totalRequests: jsResources.length + cssResources.length,
        timestamp: Date.now()
      }

      setBundleMetrics(metrics)
      
      // Track with web vitals
      webVitals.trackCustomMetric('bundle-js-size', metrics.totalJSSize, 'bytes')
      webVitals.trackCustomMetric('bundle-css-size', metrics.totalCSSSize, 'bytes')
      webVitals.trackCustomMetric('bundle-js-load-time', metrics.jsLoadTime)
      webVitals.trackCustomMetric('bundle-css-load-time', metrics.cssLoadTime)
    }

    // Calculate after page load
    if (document.readyState === 'complete') {
      calculateBundleMetrics()
    } else {
      window.addEventListener('load', calculateBundleMetrics)
      return () => window.removeEventListener('load', calculateBundleMetrics)
    }
  }, [webVitals])

  return bundleMetrics
}