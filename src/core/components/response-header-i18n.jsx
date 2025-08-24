import React from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

const ResponseHeader = ({ code, description, className }) => {
  const { t } = useTranslation()
  
  return (
    <div className={`response-header ${className || ''}`}>
      <h4 className="response-code">
        {t('responses.code')}: <strong>{code}</strong>
      </h4>
      {description && (
        <div className="response-description">
          <strong>{t('responses.description')}: </strong>
          <span>{description}</span>
        </div>
      )}
    </div>
  )
}

ResponseHeader.propTypes = {
  code: PropTypes.string.isRequired,
  description: PropTypes.string,
  className: PropTypes.string,
}

export default ResponseHeader