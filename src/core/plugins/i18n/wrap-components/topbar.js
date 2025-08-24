import React from "react"
import { useTranslation } from "react-i18next"

export default (Original, system) => {
  return function TopBarWithLanguageSelector(props) {
    const { t } = useTranslation()
    const { getComponent } = props
    const LanguageSelector = getComponent("LanguageSelector")

    return (
      <div className="topbar-container">
        <Original {...props} />
        <div className="topbar-language-selector">
          <LanguageSelector />
        </div>
      </div>
    )
  }
}