/**
 * Web Vitals Integration
 * Simplified interface for tracking Core Web Vitals using the web-vitals library approach
 */

import { getPerformanceMonitor } from './performance-monitor.js'

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 }
}

class WebVitalsTracker {
  constructor() {
    this.performanceMonitor = getPerformanceMonitor()
    this.callbacks = new Map()
    this.setupEventListeners()
  }

  setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('swagger-ui-performance', (event) => {
        const { metric, data } = event.detail
        if (this.callbacks.has(metric)) {
          this.callbacks.get(metric).forEach(callback => callback(data))
        }
      })
    }
  }

  // Public API similar to web-vitals library
  onLCP(callback) {
    this.callbacks.set('LCP', [...(this.callbacks.get('LCP') || []), callback])
    
    // If metric already exists, call callback immediately
    const existingMetric = this.performanceMonitor.getMetric('LCP')
    if (existingMetric) {
      callback(existingMetric)
    }
  }

  onFID(callback) {
    this.callbacks.set('FID', [...(this.callbacks.get('FID') || []), callback])
    
    const existingMetric = this.performanceMonitor.getMetric('FID')
    if (existingMetric) {
      callback(existingMetric)
    }
  }

  onCLS(callback) {
    this.callbacks.set('CLS', [...(this.callbacks.get('CLS') || []), callback])
    
    const existingMetric = this.performanceMonitor.getMetric('CLS')
    if (existingMetric) {
      callback(existingMetric)
    }
  }

  onTTFB(callback) {
    // Time to First Byte from navigation timing
    this.callbacks.set('Navigation', [...(this.callbacks.get('Navigation') || []), (data) => {
      if (data.firstByte !== undefined) {
        callback({
          value: data.firstByte,
          rating: this.rateMetric(data.firstByte, { good: 800, poor: 1800 }),
          timestamp: data.timestamp
        })
      }
    }])
  }

  onFCP(callback) {
    // First Contentful Paint
    this.callbacks.set('first-contentful-paint', [...(this.callbacks.get('first-contentful-paint') || []), callback])
  }

  // Track custom metrics
  trackCustomMetric(name, value, unit = 'ms') {
    const metric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      rating: this.rateCustomMetric(name, value)
    }

    this.performanceMonitor.reportMetric(name, metric)
    
    if (this.callbacks.has(name)) {
      this.callbacks.get(name).forEach(callback => callback(metric))
    }

    return metric
  }

  // Convenience methods for Swagger UI specific tracking
  trackSpecLoadTime(startTime) {
    const loadTime = performance.now() - startTime
    return this.trackCustomMetric('spec-load-time', loadTime)
  }

  trackRenderTime(component, startTime) {
    const renderTime = performance.now() - startTime
    return this.trackCustomMetric(`${component}-render-time`, renderTime)
  }

  trackAPICallTime(endpoint, startTime) {
    const callTime = performance.now() - startTime
    return this.trackCustomMetric(`api-call-${endpoint}`, callTime)
  }

  trackBundleSize() {
    // Track JavaScript bundle size from Resource Timing API
    const resources = this.performanceMonitor.getMetric('Resources') || []
    const jsResources = resources.filter(r => r.type === 'script')
    const totalSize = jsResources.reduce((sum, r) => sum + (r.size || 0), 0)
    
    return this.trackCustomMetric('bundle-size', totalSize, 'bytes')
  }

  // Rating helper
  rateMetric(value, thresholds) {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.poor) return 'needs-improvement'
    return 'poor'
  }

  rateCustomMetric(name, value) {
    // Default rating for custom metrics
    const customThresholds = {
      'spec-load-time': { good: 1000, poor: 3000 },
      'operation-render-time': { good: 100, poor: 500 },
      'model-render-time': { good: 50, poor: 200 },
      'bundle-size': { good: 500000, poor: 1000000 }
    }

    if (customThresholds[name]) {
      return this.rateMetric(value, customThresholds[name])
    }

    return 'unknown'
  }

  // Get all current vitals
  getVitals() {
    return {
      lcp: this.performanceMonitor.getMetric('LCP'),
      fid: this.performanceMonitor.getMetric('FID'),
      cls: this.performanceMonitor.getMetric('CLS'),
      fcp: this.performanceMonitor.getMetric('first-contentful-paint'),
      navigation: this.performanceMonitor.getMetric('Navigation')
    }
  }

  // Generate performance report
  generateReport() {
    const vitals = this.getVitals()
    const allMetrics = this.performanceMonitor.getMetrics()
    
    const report = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      coreWebVitals: {
        lcp: vitals.lcp,
        fid: vitals.fid,
        cls: vitals.cls
      },
      additionalMetrics: {
        fcp: vitals.fcp,
        navigation: vitals.navigation
      },
      customMetrics: Object.fromEntries(
        Object.entries(allMetrics).filter(([key]) => 
          !['LCP', 'FID', 'CLS', 'first-contentful-paint', 'Navigation', 'Resources'].includes(key)
        )
      ),
      performance: {
        memoryUsage: this.getMemoryUsage(),
        connectionType: this.getConnectionType()
      }
    }

    return report
  }

  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }

  getConnectionType() {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      }
    }
    return null
  }
}

// Singleton instance
let webVitalsTracker = null

export const getWebVitalsTracker = () => {
  if (!webVitalsTracker) {
    webVitalsTracker = new WebVitalsTracker()
  }
  return webVitalsTracker
}

// Convenience exports
export const trackLCP = (callback) => getWebVitalsTracker().onLCP(callback)
export const trackFID = (callback) => getWebVitalsTracker().onFID(callback)
export const trackCLS = (callback) => getWebVitalsTracker().onCLS(callback)
export const trackTTFB = (callback) => getWebVitalsTracker().onTTFB(callback)
export const trackFCP = (callback) => getWebVitalsTracker().onFCP(callback)

export { WebVitalsTracker }
export default getWebVitalsTracker