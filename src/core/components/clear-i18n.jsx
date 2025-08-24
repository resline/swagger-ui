import React, { Component } from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

// Higher-order component to provide translation to class component
const withTranslation = (WrappedComponent) => {
  return function TranslatedComponent(props) {
    const { t } = useTranslation()
    return <WrappedComponent {...props} t={t} />
  }
}

class Clear extends Component {

  onClick =() => {
    let { specActions, path, method } = this.props
    specActions.clearResponse( path, method )
    specActions.clearRequest( path, method )
  }

  render(){
    const { t } = this.props
    return (
      <button 
        className="btn btn-clear opblock-control__btn" 
        onClick={ this.onClick }
        aria-label={t('operation.clear')}>
        {t('operation.clear')}
      </button>
    )
  }

  static propTypes = {
    specActions: PropTypes.object.isRequired,
    path: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
  }
}

export default withTranslation(Clear)