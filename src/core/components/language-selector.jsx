import React from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

const LanguageSelector = ({ className }) => {
  const { i18n, t } = useTranslation()

  const languages = [
    { code: 'en', name: t('language.english') },
    { code: 'es', name: t('language.spanish') },
  ]

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value
    i18n.changeLanguage(selectedLanguage)
  }

  return (
    <div className={`language-selector ${className || ''}`}>
      <label htmlFor="language-select" className="language-selector__label">
        {t('language.selectLanguage')}:
      </label>
      <select
        id="language-select"
        className="language-selector__select"
        value={i18n.language}
        onChange={handleLanguageChange}
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