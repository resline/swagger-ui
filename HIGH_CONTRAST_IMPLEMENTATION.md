# High Contrast Mode Implementation Guide

## Overview

This document provides a comprehensive guide to the high contrast mode implementation for Swagger UI, designed to enhance accessibility for users with visual impairments and low vision. The implementation follows WCAG AAA standards and provides multiple contrast options.

## Features Implemented

### 1. Theme Options
- **Light Theme**: Default light mode
- **Dark Theme**: Default dark mode  
- **High Contrast Dark**: Black background with white/yellow/cyan text (21:1 contrast ratio)
- **High Contrast Light**: White background with black/blue/green text (21:1 contrast ratio)

### 2. System Integration
- Automatic detection of `prefers-contrast: high` system preference
- Automatic detection of `prefers-color-scheme: dark` preference
- Windows High Contrast Mode support via `forced-colors: active`
- Forced colors mode compatibility

### 3. Accessibility Features
- **WCAG AAA Compliance**: All text meets 7:1 contrast ratio for normal text, 4.5:1 for large text
- **Enhanced Focus Indicators**: 4px outlines with visual labels
- **Screen Reader Support**: Theme changes announced to assistive technology
- **Keyboard Navigation**: Enhanced focus states with instruction labels
- **Motion Preferences**: Respects `prefers-reduced-motion` settings
- **Pattern-Based Information**: Status indicators use patterns, not just color

## File Structure

```
src/
├── style/
│   ├── _high-contrast.scss       # Main high contrast stylesheet
│   └── main.scss                 # Updated to include high contrast styles
├── core/
│   └── components/
│       └── theme-toggle.jsx      # Updated 4-way theme toggle
└── core/
    └── utils/
        └── motion-preferences.js  # Motion accessibility utilities
```

## Implementation Details

### High Contrast Color Palette

#### Dark High Contrast (`high-contrast`)
```scss
--hc-bg-primary: #000000;        // Pure black
--hc-text-primary: #ffffff;      // Pure white (21:1 contrast)
--hc-text-secondary: #ffff00;    // Pure yellow (19.56:1 contrast)
--hc-text-tertiary: #00ff00;     // Pure green (15.3:1 contrast)
--hc-text-link: #00ffff;         // Cyan for links (16.75:1 contrast)
--hc-border-focus: #00ffff;      // Cyan focus indicators
```

#### Light High Contrast (`high-contrast-light`)
```scss
--hc-bg-primary: #ffffff;        // Pure white
--hc-text-primary: #000000;      // Pure black (21:1 contrast)
--hc-text-secondary: #0000ff;    // Pure blue (8.6:1 contrast)
--hc-text-link: #0000ff;         // Blue for links
--hc-border-focus: #ff0000;      // Red focus indicators
```

### Key Features

#### 1. Enhanced Focus Management
```scss
*:focus {
  outline: 4px solid var(--hc-border-focus) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 8px var(--hc-border-focus) !important;
  
  &::before {
    content: "FOCUSED";
    // Visual focus indicator label
  }
}
```

#### 2. System Preference Detection
```javascript
// Auto-detects high contrast system preference
const prefersHighContrast = window.matchMedia("(prefers-contrast: high)").matches
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

if (prefersHighContrast) {
  return prefersDark ? "high-contrast" : "high-contrast-light"
}
```

#### 3. Windows High Contrast Support
```scss
@media (forced-colors: active) {
  .swagger-ui * {
    background-color: Canvas !important;
    color: CanvasText !important;
    border-color: ButtonText !important;
    forced-color-adjust: none;
  }
}
```

## Testing Guidelines

### 1. Manual Testing Checklist

#### Basic Functionality
- [ ] All four theme options cycle correctly (Light → Dark → HC Dark → HC Light)
- [ ] Theme preference persists across browser sessions
- [ ] System preferences are detected automatically
- [ ] Manual theme selection overrides system preferences

#### Contrast Verification
- [ ] All text meets minimum 7:1 contrast ratio for normal text
- [ ] Large text (18pt or 14pt bold) meets 4.5:1 contrast ratio
- [ ] Focus indicators are visible with 4px minimum thickness
- [ ] All interactive elements have clear borders
- [ ] Status information doesn't rely solely on color

#### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are clearly visible in high contrast mode
- [ ] Tab order is logical and predictable
- [ ] Focus labels appear for interactive elements
- [ ] Skip links work in high contrast mode

#### Screen Reader Testing
- [ ] Theme changes are announced to screen readers
- [ ] All content is accessible via screen reader
- [ ] Alternative text is provided for visual elements
- [ ] Headings are properly structured
- [ ] Links have descriptive text

### 2. Automated Testing

#### Contrast Testing Tools
- **WebAIM Contrast Checker**: Verify all color combinations
- **Colour Contrast Analyser**: Test against WCAG standards
- **axe DevTools**: Automated accessibility scanning
- **WAVE**: Web accessibility evaluation

#### Browser Testing
- **Chrome DevTools**: 
  - Emulate `prefers-contrast: high`
  - Emulate `prefers-color-scheme: dark`
  - Emulate `prefers-reduced-motion: reduce`
- **Firefox**: Test with High Contrast themes
- **Safari**: Test system preference integration
- **Edge**: Test Windows High Contrast mode

#### Screen Reader Testing
- **NVDA** (Windows): Test with high contrast themes
- **JAWS** (Windows): Verify theme announcements
- **VoiceOver** (macOS): Test system integration
- **Orca** (Linux): Verify accessibility features

### 3. Platform-Specific Testing

#### Windows High Contrast Mode
1. Enable Windows High Contrast mode:
   - Settings → Accessibility → Contrast themes
   - Choose a high contrast theme
2. Test Swagger UI functionality:
   - [ ] Forced colors mode activates automatically
   - [ ] All elements remain functional
   - [ ] Text remains readable
   - [ ] Interactive elements are distinguishable

#### macOS
1. Enable Increase Contrast:
   - System Preferences → Accessibility → Display → Increase contrast
2. Test automatic theme switching
3. Verify VoiceOver compatibility

#### Mobile Testing
- **iOS**: Test with accessibility settings enabled
- **Android**: Test TalkBack compatibility
- **Touch targets**: Ensure 44px minimum size maintained

### 4. Visual Regression Testing

#### Key Areas to Test
- [ ] API operation blocks (GET, POST, PUT, DELETE, etc.)
- [ ] Form elements (inputs, buttons, dropdowns)
- [ ] Navigation elements (topbar, theme toggle)
- [ ] Response sections
- [ ] Error messages and alerts
- [ ] Model/schema displays
- [ ] Code blocks and syntax highlighting

#### Screenshot Comparison
Take screenshots in all four theme modes for:
1. Main API documentation page
2. Expanded operation with parameters
3. Response examples
4. Error states
5. Form interactions

### 5. Performance Testing

#### Load Time Impact
- [ ] Measure CSS load time with high contrast styles
- [ ] Test theme switching performance
- [ ] Monitor memory usage during theme changes

#### Animation Performance
- [ ] Verify smooth transitions (when motion is enabled)
- [ ] Test immediate updates (when motion is disabled)
- [ ] Ensure no animation lag in high contrast mode

## Browser Support

### Minimum Requirements
- **Chrome/Edge**: Version 76+ (prefers-contrast support)
- **Firefox**: Version 80+ (partial support)
- **Safari**: Version 14.1+ (prefers-contrast support)

### Feature Detection
```javascript
// Check for prefers-contrast support
const supportsContrastQuery = window.matchMedia("(prefers-contrast: high)").media !== "not all"
```

## Common Issues and Solutions

### 1. Focus Indicators Not Visible
**Problem**: Focus outlines are being overridden by existing styles
**Solution**: Use `!important` declarations and higher specificity in high contrast mode

### 2. Color-Only Information
**Problem**: Status information conveyed only through color
**Solution**: Add text labels, patterns, or icons for status indicators

### 3. Insufficient Contrast
**Problem**: Some elements don't meet contrast requirements
**Solution**: Use the defined CSS custom properties with guaranteed contrast ratios

### 4. System Integration Issues
**Problem**: System preference detection not working
**Solution**: Ensure proper media query support and fallback handling

## Maintenance Guidelines

### 1. Adding New Components
When adding new UI components:
1. Test in all four theme modes
2. Ensure WCAG AAA contrast compliance
3. Add appropriate focus indicators
4. Include keyboard navigation support
5. Test with screen readers

### 2. Color Usage
- Always use CSS custom properties defined in `_high-contrast.scss`
- Never hardcode colors in high contrast mode
- Test all color combinations for adequate contrast
- Provide non-color alternatives for status information

### 3. Regular Testing
- Run automated accessibility tests on every build
- Perform manual testing with high contrast modes monthly
- Update contrast ratios when base colors change
- Monitor browser support for new accessibility features

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN High Contrast Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast)
- [Windows High Contrast Mode](https://docs.microsoft.com/en-us/windows/win32/winauto/high-contrast-mode)

### Testing Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) (Free, Windows)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Commercial, Windows)
- VoiceOver (Built-in, macOS/iOS)
- [Orca](https://wiki.gnome.org/Projects/Orca) (Free, Linux)

## Conclusion

This high contrast implementation provides comprehensive accessibility support for users with visual impairments while maintaining full functionality and usability. Regular testing and maintenance are essential to ensure continued accessibility compliance and optimal user experience.