import React from "react"
import PropTypes from "prop-types"

export default class AuthorizeBtn extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    isAuthorized: PropTypes.bool,
    showPopup: PropTypes.bool,
    getComponent: PropTypes.func.isRequired
  }

  render() {
    let { isAuthorized, showPopup, onClick, getComponent } = this.props

    //must be moved out of button component
    const AuthorizationPopup = getComponent("authorizationPopup", true)
    const LockAuthIcon = getComponent("LockAuthIcon", true)
    const UnlockAuthIcon = getComponent("UnlockAuthIcon", true)

    return (
      <div className="auth-wrapper">
        <button 
          className={isAuthorized ? "btn authorize locked" : "btn authorize unlocked"} 
          onClick={onClick}
          aria-label={isAuthorized ? "Authorized - click to manage authorization" : "Not authorized - click to authorize"}
          aria-expanded={showPopup}>
          <span>Authorize</span>
          {isAuthorized ? <LockAuthIcon aria-hidden="true" /> : <UnlockAuthIcon aria-hidden="true" />}
        </button>
      { showPopup && <AuthorizationPopup /> }
      </div>
    )
  }
}
