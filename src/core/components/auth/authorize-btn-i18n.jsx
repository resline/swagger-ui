import React from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

const AuthorizeBtn = ({ 
  isAuthorized = false, 
  showPopup = false, 
  onClick = () => {}, 
  getComponent 
}) => {
  const { t } = useTranslation()

  //must be moved out of button component
  const AuthorizationPopup = getComponent("authorizationPopup", true)
  const LockAuthIcon = getComponent("LockAuthIcon", true)
  const UnlockAuthIcon = getComponent("UnlockAuthIcon", true)

  return (
    <div className="auth-wrapper">
      <button 
        className={isAuthorized ? "btn authorize locked" : "btn authorize unlocked"} 
        onClick={onClick}
        aria-label={isAuthorized 
          ? t('auth.authorize') + " - " + t('auth.logout').toLowerCase()
          : t('auth.authorize') + " - " + t('auth.authRequired').toLowerCase()
        }
        aria-expanded={showPopup}>
        <span>{t('auth.authorize')}</span>
        {isAuthorized ? <LockAuthIcon aria-hidden="true" /> : <UnlockAuthIcon aria-hidden="true" />}
      </button>
    { showPopup && <AuthorizationPopup /> }
    </div>
  )
}

AuthorizeBtn.propTypes = {
  onClick: PropTypes.func,
  isAuthorized: PropTypes.bool,
  showPopup: PropTypes.bool,
  getComponent: PropTypes.func.isRequired
}

export default AuthorizeBtn