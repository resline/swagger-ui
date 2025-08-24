# Swagger UI i18n Implementation Guide

## Overview

This implementation adds comprehensive internationalization (i18n) support to Swagger UI using i18next and react-i18next. The system provides:

- Automatic language detection from browser settings
- Manual language switching via a dropdown selector
- Persistent language preference storage
- Comprehensive translation coverage for UI elements
- Easy extensibility for additional languages

## Features Implemented

### 1. Core i18n Infrastructure

- **i18next Configuration**: Set up with browser language detection and localStorage persistence
- **Translation Files**: JSON-based translation structure for easy maintenance
- **Plugin Architecture**: Modular i18n plugin that wraps existing components

### 2. Language Support

- **English (en)**: Complete base translation set
- **Spanish (es)**: Full translation for demonstration
- **Extensible**: Easy to add new languages by creating new JSON files

### 3. Component Coverage

The following components have been updated with i18n support:

- **Info Component**: API title, description, terms of service links
- **Try It Out Button**: Action buttons (Try it out, Cancel, Reset)
- **Authorization**: Auth buttons and labels
- **Execute Button**: Execute action with translations
- **Clear Button**: Clear functionality with translations
- **Language Selector**: New component for language switching

### 4. User Interface Integration

- **TopBar Integration**: Language selector positioned in top-right corner
- **Responsive Design**: Works across different screen sizes
- **Accessibility**: Proper ARIA labels and semantic markup

## File Structure

```
src/
├── core/
│   ├── i18n/
│   │   ├── index.js                 # i18next configuration
│   │   └── locales/
│   │       ├── en.json             # English translations
│   │       └── es.json             # Spanish translations
│   ├── components/
│   │   ├── language-selector.jsx    # Language switching component
│   │   ├── info-i18n.jsx          # Internationalized Info component
│   │   ├── try-it-out-button-i18n.jsx
│   │   ├── execute-i18n.jsx
│   │   ├── clear-i18n.jsx
│   │   └── auth/
│   │       └── authorize-btn-i18n.jsx
│   └── plugins/
│       └── i18n/
│           ├── index.js             # i18n plugin definition
│           ├── after-load.js        # Initialize i18n on startup
│           ├── wrap-components.js   # Component wrappers
│           └── wrap-components/     # Individual component wrappers
└── style/
    ├── _language-selector.scss     # Language selector styles
    └── _topbar-i18n.scss          # TopBar integration styles
```

## Translation Structure

### Translation Keys Organization

```json
{
  "common": {
    "baseUrl": "Base URL",
    "termsOfService": "Terms of service",
    "tryItOut": "Try it out",
    "cancel": "Cancel",
    "execute": "Execute",
    "clear": "Clear"
  },
  "info": {
    "title": "API Documentation",
    "version": "Version"
  },
  "operation": {
    "tryItOut": "Try it out",
    "cancel": "Cancel",
    "execute": "Execute",
    "clear": "Clear"
  },
  "auth": {
    "authorize": "Authorize",
    "logout": "Logout"
  },
  "language": {
    "selectLanguage": "Select Language",
    "english": "English",
    "spanish": "Español"
  }
}
```

## Usage

### Basic Setup

The i18n system is automatically enabled when the I18n plugin is included:

```javascript
const ui = SwaggerUIBundle({
  // ... other config
  plugins: [
    SwaggerUIBundle.plugins.I18n  // Add this line
  ]
});
```

### Adding New Languages

1. Create a new translation file in `src/core/i18n/locales/[language-code].json`
2. Copy the structure from `en.json` and translate all values
3. Import the new translations in `src/core/i18n/index.js`:

```javascript
import frTranslations from './locales/fr.json';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations }, // Add new language
};
```

4. Update the LanguageSelector component to include the new language option.

### Custom Translation Usage

In any React component, use the `useTranslation` hook:

```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button>{t('common.cancel')}</button>
    </div>
  );
};
```

For class components, use the higher-order component pattern:

```javascript
const withTranslation = (WrappedComponent) => {
  return function TranslatedComponent(props) {
    const { t } = useTranslation();
    return <WrappedComponent {...props} t={t} />;
  };
};
```

## Configuration Options

### i18next Settings

The i18n system can be configured by modifying `src/core/i18n/index.js`:

```javascript
i18n.init({
  debug: process.env.NODE_ENV === 'development', // Enable debug logs
  fallbackLng: 'en',                             // Default language
  interpolation: {
    escapeValue: false                           // React handles escaping
  },
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'], // Detection order
    caches: ['localStorage']                          // Persistence
  }
});
```

### Language Detection Priority

1. **localStorage**: Previously selected language
2. **navigator**: Browser language preference
3. **htmlTag**: HTML lang attribute

## Testing

### Demo File

A demo HTML file (`i18n-demo.html`) is provided to test the implementation:

1. Build the project: `npm run build:core`
2. Open `i18n-demo.html` in a browser
3. Use the language selector to switch between English and Spanish
4. Verify that all UI elements update correctly

### Manual Testing Checklist

- [ ] Language selector appears in top-right corner
- [ ] Language switching works without page reload
- [ ] Selected language persists after browser refresh
- [ ] All translated components update correctly
- [ ] Fallback to English works for missing translations
- [ ] Browser language detection works on first visit

## Browser Support

The i18n implementation supports:

- Modern browsers with ES6+ support
- localStorage for language persistence
- i18next browser language detection

## Performance Considerations

- Translation files are imported statically for optimal bundling
- Language switching is near-instantaneous (no API calls)
- Small bundle size impact (~3KB for i18next libraries)

## Future Enhancements

### Suggested Improvements

1. **Dynamic Language Loading**: Load translation files on demand
2. **Pluralization**: Add support for plural forms in different languages
3. **RTL Support**: Add right-to-left language support
4. **Context Translation**: Context-aware translations for better accuracy
5. **Translation Management**: Integration with translation services

### Additional Languages to Consider

- French (fr)
- German (de)
- Chinese Simplified (zh-CN)
- Japanese (ja)
- Portuguese (pt)
- Russian (ru)

## Troubleshooting

### Common Issues

1. **Translations not loading**: Check that translation files are properly imported
2. **Language selector not showing**: Verify the I18n plugin is enabled
3. **Fallback not working**: Ensure 'en' translations exist for all keys
4. **Styling issues**: Check that CSS files are properly included

### Debug Mode

Enable debug mode for development:

```javascript
// In src/core/i18n/index.js
i18n.init({
  debug: true, // Enable debug logging
  // ... other options
});
```

## Contributing

When adding new translatable strings:

1. Add the key to all existing translation files
2. Use descriptive, hierarchical keys (e.g., `operation.tryItOut`)
3. Test with multiple languages
4. Update this documentation

## Dependencies

- i18next: ^23.x.x
- react-i18next: ^13.x.x
- i18next-browser-languagedetector: ^7.x.x

These dependencies are included in the package.json and bundled with the build.