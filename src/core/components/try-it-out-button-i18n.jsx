import React from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

const TryItOutButton = ({ 
  onTryoutClick = () => {},
  onCancelClick = () => {},
  onResetClick = () => {},
  enabled = false,
  hasUserEditedBody = false,
  isOAS3 = false 
}) => {
  const { t } = useTranslation()

  const showReset = isOAS3 && hasUserEditedBody
  return (
    <div className={showReset ? "try-out btn-group" : "try-out"}>
      {
        enabled ? <button 
                    className="btn try-out__btn cancel" 
                    onClick={ onCancelClick }
                    aria-label={t('operation.cancel')}>
                    {t('operation.cancel')}
                  </button>
                : <button 
                    className="btn try-out__btn" 
                    onClick={ onTryoutClick }
                    aria-label={t('operation.tryItOut')}>
                    {t('operation.tryItOut')}
                  </button>

      }
      {
        showReset && <button 
                      className="btn try-out__btn reset" 
                      onClick={ onResetClick }
                      aria-label={t('operation.reset')}>
                      {t('operation.reset')}
                    </button>
      }
    </div>
  )
}

TryItOutButton.propTypes = {
  onTryoutClick: PropTypes.func,
  onResetClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  enabled: PropTypes.bool, // Try it out is enabled, ie: the user has access to the form
  hasUserEditedBody: PropTypes.bool, // Try it out is enabled, ie: the user has access to the form
  isOAS3: PropTypes.bool, // Try it out is enabled, ie: the user has access to the form
}

export default TryItOutButton