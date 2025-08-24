# 🌍 Internationalization (i18n) Implementation Guide for Swagger UI

## Overview

This guide provides a complete implementation plan for adding internationalization support to Swagger UI, enabling multi-language support for global users.

## Technology Stack

- **react-i18next**: React bindings for i18next
- **i18next**: Core internationalization framework
- **i18next-browser-languagedetector**: Automatic language detection
- **i18next-http-backend**: Load translations from files

## Installation

```bash
npm install --save i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

## Project Structure

```
src/
├── i18n/
│   ├── config.js           # i18n configuration
│   ├── languages.js        # Supported languages list
│   └── locales/
│       ├── en/
│       │   ├── common.json
│       │   ├── operations.json
│       │   ├── models.json
│       │   ├── auth.json
│       │   └── errors.json
│       ├── es/
│       │   └── ... (Spanish translations)
│       ├── fr/
│       │   └── ... (French translations)
│       ├── de/
│       │   └── ... (German translations)
│       ├── zh/
│       │   └── ... (Chinese translations)
│       └── ja/
│           └── ... (Japanese translations)
```

## 1. i18n Configuration

```javascript
// src/i18n/config.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enCommon from './locales/en/common.json';
import enOperations from './locales/en/operations.json';
import enModels from './locales/en/models.json';
import enAuth from './locales/en/auth.json';
import enErrors from './locales/en/errors.json';

const resources = {
  en: {
    common: enCommon,
    operations: enOperations,
    models: enModels,
    auth: enAuth,
    errors: enErrors,
  },
  // Add other languages as they're translated
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    ns: ['common', 'operations', 'models', 'auth', 'errors'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
```

## 2. Translation Files

```json
// src/i18n/locales/en/common.json
{
  "app": {
    "title": "Swagger UI",
    "subtitle": "API Documentation",
    "version": "Version {{version}}",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "navigation": {
    "operations": "Operations",
    "models": "Models",
    "info": "Info",
    "servers": "Servers",
    "authorize": "Authorize"
  },
  "buttons": {
    "tryItOut": "Try it out",
    "execute": "Execute",
    "cancel": "Cancel",
    "clear": "Clear",
    "download": "Download",
    "copy": "Copy",
    "close": "Close",
    "authorize": "Authorize",
    "logout": "Logout"
  },
  "labels": {
    "description": "Description",
    "parameters": "Parameters",
    "requestBody": "Request body",
    "responses": "Responses",
    "callbacks": "Callbacks",
    "deprecated": "Deprecated",
    "required": "Required",
    "optional": "Optional",
    "example": "Example",
    "schema": "Schema"
  },
  "messages": {
    "noOperations": "No operations defined in this API",
    "noModels": "No models defined in this API",
    "copied": "Copied to clipboard",
    "downloadComplete": "Download complete",
    "authRequired": "Authorization required"
  }
}
```

```json
// src/i18n/locales/en/operations.json
{
  "methods": {
    "get": "GET",
    "post": "POST",
    "put": "PUT",
    "delete": "DELETE",
    "patch": "PATCH",
    "options": "OPTIONS",
    "head": "HEAD"
  },
  "sections": {
    "parameters": "Parameters",
    "requestBody": "Request body",
    "responses": "Responses",
    "callbacks": "Callbacks",
    "security": "Security"
  },
  "parameterTypes": {
    "path": "Path",
    "query": "Query",
    "header": "Header",
    "cookie": "Cookie"
  },
  "contentTypes": {
    "label": "Content type",
    "json": "application/json",
    "xml": "application/xml",
    "form": "application/x-www-form-urlencoded",
    "multipart": "multipart/form-data"
  },
  "responses": {
    "default": "Default response",
    "success": "Successful response",
    "error": "Error response",
    "codes": {
      "200": "OK",
      "201": "Created",
      "204": "No Content",
      "400": "Bad Request",
      "401": "Unauthorized",
      "403": "Forbidden",
      "404": "Not Found",
      "500": "Internal Server Error"
    }
  }
}
```

```json
// src/i18n/locales/es/common.json (Spanish)
{
  "app": {
    "title": "Swagger UI",
    "subtitle": "Documentación de API",
    "version": "Versión {{version}}",
    "loading": "Cargando...",
    "error": "Ocurrió un error"
  },
  "navigation": {
    "operations": "Operaciones",
    "models": "Modelos",
    "info": "Información",
    "servers": "Servidores",
    "authorize": "Autorizar"
  },
  "buttons": {
    "tryItOut": "Pruébalo",
    "execute": "Ejecutar",
    "cancel": "Cancelar",
    "clear": "Limpiar",
    "download": "Descargar",
    "copy": "Copiar",
    "close": "Cerrar",
    "authorize": "Autorizar",
    "logout": "Cerrar sesión"
  }
}
```

## 3. React Component Integration

```javascript
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './i18n/config'; // Import i18n configuration
import App from './App';

ReactDOM.render(
  <React.Suspense fallback="Loading...">
    <App />
  </React.Suspense>,
  document.getElementById('root')
);
```

```javascript
// src/core/components/operation.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const Operation = ({ operation }) => {
  const { t } = useTranslation(['operations', 'common']);

  return (
    <div className="operation">
      <div className="operation-method">
        {t(`operations:methods.${operation.method.toLowerCase()}`)}
      </div>
      <div className="operation-path">{operation.path}</div>
      
      {operation.deprecated && (
        <span className="deprecated-badge">
          {t('common:labels.deprecated')}
        </span>
      )}

      <div className="operation-description">
        {operation.description}
      </div>

      <button className="try-out-btn">
        {t('common:buttons.tryItOut')}
      </button>

      <div className="parameters-section">
        <h3>{t('operations:sections.parameters')}</h3>
        {/* Parameters content */}
      </div>

      <div className="responses-section">
        <h3>{t('operations:sections.responses')}</h3>
        {/* Responses content */}
      </div>
    </div>
  );
};

export default Operation;
```

## 4. Language Selector Component

```javascript
// src/core/components/language-selector.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../../i18n/languages';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="language-selector">
      <select 
        value={i18n.language} 
        onChange={(e) => changeLanguage(e.target.value)}
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
```

```javascript
// src/i18n/languages.js
export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];
```

## 5. HOC for Class Components

```javascript
// src/core/hocs/with-translation.js
import React from 'react';
import { withTranslation } from 'react-i18next';

export const withI18n = (Component) => {
  return withTranslation(['common', 'operations', 'models', 'auth', 'errors'])(
    class extends React.Component {
      render() {
        return <Component {...this.props} />;
      }
    }
  );
};

// Usage in class component
import { withI18n } from '../hocs/with-translation';

class OperationClass extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <div>
        <h2>{t('operations:sections.parameters')}</h2>
        {/* Component content */}
      </div>
    );
  }
}

export default withI18n(OperationClass);
```

## 6. Dynamic Content Translation

```javascript
// src/core/utils/translation-helpers.js
import i18n from '../../i18n/config';

// Translate dynamic content
export const translateDynamic = (key, namespace = 'common') => {
  return i18n.t(`${namespace}:${key}`);
};

// Translate with interpolation
export const translateWithParams = (key, params, namespace = 'common') => {
  return i18n.t(`${namespace}:${key}`, params);
};

// Pluralization
export const translatePlural = (key, count, namespace = 'common') => {
  return i18n.t(`${namespace}:${key}`, { count });
};

// Format numbers according to locale
export const formatNumber = (number) => {
  return new Intl.NumberFormat(i18n.language).format(number);
};

// Format dates according to locale
export const formatDate = (date, options = {}) => {
  return new Intl.DateTimeFormat(i18n.language, options).format(date);
};
```

## 7. RTL Support

```javascript
// src/core/utils/rtl-support.js
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const isRTL = (language) => {
  return RTL_LANGUAGES.includes(language);
};

export const applyRTL = (language) => {
  const isRtl = isRTL(language);
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
  
  // Apply RTL-specific styles
  if (isRtl) {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }
};

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  applyRTL(lng);
});
```

```scss
// src/styles/rtl.scss
.rtl {
  // Flip layout for RTL languages
  .operation-method {
    margin-left: 0;
    margin-right: 10px;
  }

  .parameter-name {
    text-align: right;
  }

  .btn-group {
    flex-direction: row-reverse;
  }

  // Flip icons
  .arrow-icon {
    transform: scaleX(-1);
  }
}
```

## 8. Testing i18n

```javascript
// test/i18n/i18n.test.js
import i18n from '../../src/i18n/config';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

describe('i18n Tests', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render in English by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    );
    expect(screen.getByText('Try it out')).toBeInTheDocument();
  });

  it('should switch to Spanish', async () => {
    await i18n.changeLanguage('es');
    render(
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    );
    expect(screen.getByText('Pruébalo')).toBeInTheDocument();
  });

  it('should handle missing translations', () => {
    const result = i18n.t('missing.key');
    expect(result).toBe('missing.key'); // Falls back to key
  });
});
```

## 9. Build Configuration

```json
// package.json
{
  "scripts": {
    "i18n:extract": "i18next-scanner --config i18next-scanner.config.js",
    "i18n:validate": "node scripts/validate-translations.js",
    "i18n:missing": "node scripts/find-missing-translations.js",
    "i18n:build": "node scripts/build-translations.js"
  }
}
```

```javascript
// i18next-scanner.config.js
module.exports = {
  input: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**',
  ],
  output: './src/i18n/locales',
  options: {
    func: {
      list: ['t', 'i18n.t'],
      extensions: ['.js', '.jsx'],
    },
    lngs: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
    defaultLng: 'en',
    defaultNs: 'common',
    resource: {
      loadPath: '{{lng}}/{{ns}}.json',
      savePath: '{{lng}}/{{ns}}.json',
      jsonIndent: 2,
    },
  },
};
```

## 10. Performance Optimization

```javascript
// src/i18n/lazy-load.js
import i18n from 'i18next';

// Lazy load translations for non-default languages
export const loadLanguage = async (language) => {
  if (!i18n.hasResourceBundle(language, 'common')) {
    const translations = await import(
      /* webpackChunkName: "i18n-[request]" */
      `./locales/${language}/common.json`
    );
    i18n.addResourceBundle(language, 'common', translations.default);
  }
};

// Preload common languages
export const preloadLanguages = async () => {
  const commonLanguages = ['en', 'es', 'fr', 'de'];
  await Promise.all(
    commonLanguages.map(lang => loadLanguage(lang))
  );
};
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Install i18next dependencies
- [ ] Set up i18n configuration
- [ ] Create translation file structure
- [ ] Implement language selector

### Week 2: Core Translation
- [ ] Extract all hardcoded strings
- [ ] Create English translation files
- [ ] Integrate useTranslation hooks
- [ ] Add HOCs for class components

### Week 3: Additional Languages
- [ ] Add Spanish translations
- [ ] Add French translations
- [ ] Add German translations
- [ ] Implement RTL support

### Week 4: Polish & Testing
- [ ] Add remaining languages
- [ ] Implement lazy loading
- [ ] Add translation tests
- [ ] Performance optimization

## Success Metrics

- Support for 10+ languages
- 100% of UI strings translated
- < 50KB translation bundle per language
- Automatic language detection
- RTL language support
- Zero translation-related bugs

---

**Note:** Start with core UI elements and gradually expand translation coverage. Consider using professional translation services for accuracy.