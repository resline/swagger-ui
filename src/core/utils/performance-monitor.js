/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and other performance metrics for Swagger UI
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
    this.isSupported = this.checkSupport()
    
    if (this.isSupported) {
      this.initializeObservers()
    }
  }

  checkSupport() {
    return (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'PerformanceObserver' in window
    )
  }

  initializeObservers() {
    // Core Web Vitals: Largest Contentful Paint (LCP)
    this.observeLCP()
    
    // Core Web Vitals: First Input Delay (FID)
    this.observeFID()
    
    // Core Web Vitals: Cumulative Layout Shift (CLS)
    this.observeCLS()
    
    // Additional metrics
    this.observeNavigation()
    this.observeResourceTiming()
    this.observePaintTiming()
  }

  observeLCP() {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        this.metrics.set('LCP', {
          value: lastEntry.renderTime || lastEntry.loadTime,
          timestamp: Date.now(),
          rating: this.rateLCP(lastEntry.renderTime || lastEntry.loadTime)
        })
        
        this.reportMetric('LCP', this.metrics.get('LCP'))
      })
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.set('LCP', observer)
    } catch (e) {
      console.warn('LCP observation failed:', e)
    }
  }

  observeFID() {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime
          
          this.metrics.set('FID', {
            value: fid,
            timestamp: Date.now(),
            rating: this.rateFID(fid)
          })
          
          this.reportMetric('FID', this.metrics.get('FID'))
        })
      })
      
      observer.observe({ type: 'first-input', buffered: true })
      this.observers.set('FID', observer)
    } catch (e) {
      console.warn('FID observation failed:', e)
    }
  }

  observeCLS() {
    try {
      let clsValue = 0
      let sessionValue = 0
      let sessionEntries = []
      
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0]
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1]
            
            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value
              sessionEntries.push(entry)
            } else {
              sessionValue = entry.value
              sessionEntries = [entry]
            }
            
            if (sessionValue > clsValue) {
              clsValue = sessionValue
              
              this.metrics.set('CLS', {
                value: clsValue,
                timestamp: Date.now(),
                rating: this.rateCLS(clsValue)
              })
              
              this.reportMetric('CLS', this.metrics.get('CLS'))
            }
          }
        })
      })
      
      observer.observe({ type: 'layout-shift', buffered: true })
      this.observers.set('CLS', observer)
    } catch (e) {
      console.warn('CLS observation failed:', e)
    }
  }

  observeNavigation() {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          this.metrics.set('Navigation', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            firstByte: entry.responseStart - entry.requestStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            timestamp: Date.now()
          })
          
          this.reportMetric('Navigation', this.metrics.get('Navigation'))
        })
      })
      
      observer.observe({ type: 'navigation', buffered: true })
      this.observers.set('Navigation', observer)
    } catch (e) {
      console.warn('Navigation observation failed:', e)
    }
  }

  observeResourceTiming() {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const resources = entries.map(entry => ({
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize,
          type: this.getResourceType(entry.name)
        }))
        
        this.metrics.set('Resources', resources)
        this.reportMetric('Resources', resources)
      })
      
      observer.observe({ type: 'resource', buffered: true })
      this.observers.set('Resources', observer)
    } catch (e) {
      console.warn('Resource timing observation failed:', e)
    }
  }

  observePaintTiming() {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          this.metrics.set(entry.name, {
            value: entry.startTime,
            timestamp: Date.now()
          })
          
          this.reportMetric(entry.name, this.metrics.get(entry.name))
        })
      })
      
      observer.observe({ type: 'paint', buffered: true })
      this.observers.set('Paint', observer)
    } catch (e) {
      console.warn('Paint timing observation failed:', e)
    }
  }

  // Rating functions based on Core Web Vitals thresholds
  rateLCP(value) {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  rateFID(value) {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  rateCLS(value) {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  getResourceType(url) {
    if (url.endsWith('.js')) return 'script'
    if (url.endsWith('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    if (url.endsWith('.woff') || url.endsWith('.woff2') || url.endsWith('.ttf')) return 'font'
    return 'other'
  }

  reportMetric(name, data) {
    // Send to analytics service or log to console
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Performance Metric: ${name}`)
      console.log('Data:', data)
      console.groupEnd()
    }
    
    // Dispatch custom event for external monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('swagger-ui-performance', {
        detail: { metric: name, data }
      }))
    }
  }

  // Public API
  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  getMetric(name) {
    return this.metrics.get(name)
  }

  markStart(name) {
    if (this.isSupported) {
      performance.mark(`${name}-start`)
    }
  }

  markEnd(name) {
    if (this.isSupported) {
      performance.mark(`${name}-end`)
      try {
        performance.measure(name, `${name}-start`, `${name}-end`)
        const measure = performance.getEntriesByName(name, 'measure')[0]
        
        this.metrics.set(name, {
          duration: measure.duration,
          timestamp: Date.now()
        })
        
        this.reportMetric(name, this.metrics.get(name))
      } catch (e) {
        console.warn(`Failed to measure ${name}:`, e)
      }
    }
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// Singleton instance
let performanceMonitor = null

export const getPerformanceMonitor = () => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

export { PerformanceMonitor }
export default getPerformanceMonitor