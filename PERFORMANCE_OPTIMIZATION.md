# ⚡ Performance Optimization Guide for Swagger UI

## Bundle Size Reduction Strategy

### 1. Webpack Configuration Optimization

```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { BundleStatsWebpackPlugin } = require('bundle-stats-webpack-plugin');

module.exports = {
  mode: 'production',
  
  optimization: {
    usedExports: true,
    sideEffects: false,
    
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        // Separate large libraries
        lodash: {
          test: /[\\/]node_modules[\\/]lodash[\\/]/,
          name: 'lodash',
          priority: 20,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-redux)[\\/]/,
          name: 'react-vendor',
          priority: 20,
        },
        immutable: {
          test: /[\\/]node_modules[\\/]immutable[\\/]/,
          name: 'immutable',
          priority: 20,
        },
      },
    },
    
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: { ecma: 8 },
          compress: {
            ecma: 5,
            warnings: false,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log'],
          },
          mangle: { safari10: true },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
      }),
    ],
  },
  
  plugins: [
    // Gzip compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
    
    // Brotli compression
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: { level: 11 },
      threshold: 8192,
      minRatio: 0.8,
      filename: '[path][base].br',
    }),
    
    // Bundle analysis
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
    new BundleStatsWebpackPlugin(),
  ].filter(Boolean),
};
```

### 2. Lodash Optimization

```javascript
// babel.config.js
module.exports = {
  plugins: [
    // Import only what you need from lodash
    ['babel-plugin-lodash', {
      'id': ['lodash', 'lodash-es']
    }],
  ],
};

// src/core/utils/lodash-imports.js
// Instead of:
// import _ from 'lodash';

// Use specific imports:
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import get from 'lodash/get';
import set from 'lodash/set';
import merge from 'lodash/merge';

export { debounce, throttle, get, set, merge };
```

### 3. React Component Lazy Loading

```javascript
// src/core/components/lazy-components.js
import React, { lazy, Suspense } from 'react';

// Lazy load heavy components
const Operations = lazy(() => 
  import(/* webpackChunkName: "operations" */ './operations')
);

const Models = lazy(() => 
  import(/* webpackChunkName: "models" */ './models')
);

const JsonSchemaForm = lazy(() => 
  import(/* webpackChunkName: "json-schema-form" */ './json-schema-form')
);

const ResponseBody = lazy(() => 
  import(/* webpackChunkName: "response-body" */ './response-body')
);

// Loading component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

// Wrapper component with error boundary
export const LazyComponent = ({ Component, ...props }) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component {...props} />
  </Suspense>
);

// Export lazy components
export { Operations, Models, JsonSchemaForm, ResponseBody };
```

### 4. Virtual Scrolling for Large Lists

```javascript
// src/core/components/virtual-list.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

const VirtualList = ({ 
  items, 
  itemHeight = 50, 
  containerHeight = 600, 
  renderItem,
  overscan = 3 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef();

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1, 
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div 
      ref={scrollElementRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualList;
```

### 5. Memoization and Performance Hooks

```javascript
// src/core/hooks/performance-hooks.js
import { useMemo, useCallback, memo } from 'react';
import { createSelector } from 'reselect';

// Memoized selector for expensive computations
export const useOperationsByTag = createSelector(
  [state => state.spec.operations, (state, tag) => tag],
  (operations, tag) => {
    return operations.filter(op => op.tags.includes(tag));
  }
);

// Custom hook for debounced search
export const useDebouncedSearch = (searchFn, delay = 300) => {
  const debouncedFn = useCallback(
    debounce(searchFn, delay),
    [searchFn, delay]
  );
  
  return debouncedFn;
};

// Memoized component example
export const ExpensiveComponent = memo(({ data, config }) => {
  const processedData = useMemo(() => {
    // Expensive data processing
    return data.map(item => ({
      ...item,
      computed: heavyComputation(item, config)
    }));
  }, [data, config]);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id}>{item.computed}</div>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return prevProps.data === nextProps.data && 
         prevProps.config === nextProps.config;
});
```

### 6. Service Worker for Caching

```javascript
// src/service-worker.js
const CACHE_NAME = 'swagger-ui-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/swagger-ui.css',
  '/swagger-ui-bundle.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### 7. Image and Asset Optimization

```javascript
// webpack.config.js - Image optimization
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 75
              }
            }
          }
        ]
      }
    ]
  }
};
```

### 8. Performance Monitoring

```javascript
// src/core/utils/performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.initializeMetrics();
  }

  initializeMetrics() {
    // Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Custom metrics
    this.measureInitialLoad();
    this.measureApiResponseTimes();
  }

  measureInitialLoad() {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      this.metrics.initialLoad = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        request: perfData.responseStart - perfData.requestStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domComplete - perfData.domInteractive,
        load: perfData.loadEventEnd - perfData.loadEventStart,
        total: perfData.loadEventEnd - perfData.fetchStart,
      };
    });
  }

  measureApiResponseTimes() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        this.recordApiCall(args[0], endTime - startTime);
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.recordApiCall(args[0], endTime - startTime, true);
        throw error;
      }
    };
  }

  recordApiCall(url, duration, error = false) {
    if (!this.metrics.apiCalls) {
      this.metrics.apiCalls = [];
    }
    this.metrics.apiCalls.push({
      url,
      duration,
      error,
      timestamp: Date.now()
    });
  }

  getMetrics() {
    return this.metrics;
  }

  reportMetrics() {
    // Send metrics to analytics service
    if (window.analytics) {
      window.analytics.track('Performance Metrics', this.metrics);
    }
  }
}

export default new PerformanceMonitor();
```

## Performance Testing

```json
// package.json - Performance scripts
{
  "scripts": {
    "perf:lighthouse": "lighthouse http://localhost:8080 --output html --output-path ./lighthouse-report.html",
    "perf:bundle": "webpack-bundle-analyzer dist/stats.json",
    "perf:size": "size-limit",
    "perf:build": "ANALYZE=true npm run build",
    "perf:test": "npm run perf:lighthouse && npm run perf:size"
  },
  "size-limit": [
    {
      "path": "dist/swagger-ui-bundle.js",
      "limit": "500 KB"
    },
    {
      "path": "dist/swagger-ui.css",
      "limit": "50 KB"
    }
  ]
}
```

## Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
- [ ] Implement lodash tree-shaking
- [ ] Add compression plugins (gzip/brotli)
- [ ] Remove console.logs in production
- [ ] Enable webpack optimization flags

### Phase 2: Code Splitting (Week 2)
- [ ] Implement lazy loading for heavy components
- [ ] Set up route-based code splitting
- [ ] Configure webpack splitChunks
- [ ] Add Suspense boundaries

### Phase 3: Runtime Optimization (Week 3)
- [ ] Implement virtual scrolling for large lists
- [ ] Add memoization to expensive computations
- [ ] Optimize React re-renders
- [ ] Implement service worker caching

### Phase 4: Monitoring (Week 4)
- [ ] Set up performance monitoring
- [ ] Implement Core Web Vitals tracking
- [ ] Add performance budgets
- [ ] Configure automated performance testing

## Expected Results

- **Bundle Size**: Reduce from 13MB to <5MB (60% reduction)
- **Initial Load**: Improve by 40-50%
- **Time to Interactive**: Reduce by 30%
- **Lighthouse Score**: Achieve 90+ performance score

## Performance Budget

```javascript
// performance.budget.js
module.exports = {
  bundles: [
    {
      name: 'main',
      size: '500KB',
    },
    {
      name: 'vendor',
      size: '300KB',
    },
  ],
  assets: [
    {
      type: 'image',
      maxSize: '100KB',
    },
    {
      type: 'font',
      maxSize: '50KB',
    },
  ],
  metrics: {
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    tti: 3500, // 3.5s
  },
};
```

---

**Note:** Implement these optimizations incrementally and measure performance after each change to ensure improvements.