import React from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"
import { isRTL } from "../../i18n"

const LanguageSelector = ({ className }) => {
  const { i18n, t } = useTranslation()

  const languages = [
    { code: 'en', name: t('language.english') },
    { code: 'es', name: t('language.spanish') },
    { code: 'fr', name: t('language.french') },
    { code: 'de', name: t('language.german') },
    { code: 'zh-CN', name: t('language.chinese') },
    { code: 'ja', name: t('language.japanese') },
    { code: 'pt', name: t('language.portuguese') },
    { code: 'ar', name: t('language.arabic') },
  ]

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value
    i18n.changeLanguage(selectedLanguage)
    
    // The direction change is handled automatically by the i18n languageChanged event
    // but we can also trigger any additional UI updates here if needed
  }

  const currentLanguageIsRTL = isRTL(i18n.language)

  return (
    <div className={`language-selector ${className || ''}`} dir={currentLanguageIsRTL ? 'rtl' : 'ltr'}>
      <label htmlFor="language-select" className="language-selector__label">
        {t('language.selectLanguage')}:
      </label>
      <select
        id="language-select"
        className="language-selector__select"
        value={i18n.language}
        onChange={handleLanguageChange}
        aria-label={t('language.selectLanguage')}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}

LanguageSelector.propTypes = {
  className: PropTypes.string,
}

export default LanguageSelector