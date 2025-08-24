/**
 * @prettier
 */
import React from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"
import { isRTL } from "../../i18n"

const BaseLayout = (props) => {
  const { i18n, t } = useTranslation()
  const { errSelectors, specSelectors, getComponent } = props

  const SvgAssets = getComponent("SvgAssets")
  const InfoContainer = getComponent("InfoContainer", true)
  const VersionPragmaFilter = getComponent("VersionPragmaFilter")
  const Operations = getComponent("operations", true)
  const Models = getComponent("Models", true)
  const Webhooks = getComponent("Webhooks", true)
  const Row = getComponent("Row")
  const Col = getComponent("Col")
  const Errors = getComponent("errors", true)
  const SkipLinks = getComponent("SkipLinks")

  const ServersContainer = getComponent("ServersContainer", true)
  const SchemesContainer = getComponent("SchemesContainer", true)
  const AuthorizeBtnContainer = getComponent("AuthorizeBtnContainer", true)
  const FilterContainer = getComponent("FilterContainer", true)
  const isSwagger2 = specSelectors.isSwagger2()
  const isOAS3 = specSelectors.isOAS3()
  const isOAS31 = specSelectors.isOAS31()

  const isSpecEmpty = !specSelectors.specStr()

  const loadingStatus = specSelectors.loadingStatus()

  // Determine if current language is RTL
  const currentLanguageIsRTL = isRTL(i18n.language)
  const direction = currentLanguageIsRTL ? 'rtl' : 'ltr'

  let loadingMessage = null

  if (loadingStatus === "loading") {
    loadingMessage = (
      <div className="info">
        <div className="loading-container">
          <div className="loading"></div>
        </div>
      </div>
    )
  }

  if (loadingStatus === "failed") {
    loadingMessage = (
      <div className="info">
        <div className="loading-container">
          <h4 className="title">{t('errors.serverError', 'Failed to load API definition.')}</h4>
          <Errors />
        </div>
      </div>
    )
  }

  if (loadingStatus === "failedConfig") {
    const lastErr = errSelectors.lastError()
    const lastErrMsg = lastErr ? lastErr.get("message") : ""
    loadingMessage = (
      <div className="info failed-config">
        <div className="loading-container">
          <h4 className="title">{t('errors.networkError', 'Failed to load remote configuration.')}</h4>
          <p>{lastErrMsg}</p>
        </div>
      </div>
    )
  }

  if (!loadingMessage && isSpecEmpty) {
    loadingMessage = <h4>{t('info.noDescription', 'No API definition provided.')}</h4>
  }

  if (loadingMessage) {
    return (
      <div className="swagger-ui" dir={direction} lang={i18n.language}>
        <div className="loading-container">{loadingMessage}</div>
      </div>
    )
  }

  const servers = specSelectors.servers()
  const schemes = specSelectors.schemes()

  const hasServers = servers && servers.size
  const hasSchemes = schemes && schemes.size
  const hasSecurityDefinitions = !!specSelectors.securityDefinitions()

  return (
    <div className="swagger-ui" dir={direction} lang={i18n.language}>
      <SkipLinks />
      <SvgAssets />
      <VersionPragmaFilter
        isSwagger2={isSwagger2}
        isOAS3={isOAS3}
        alsoShow={<Errors />}
      >
        <Errors />
        <header role="banner" className="information-container">
          <Row>
            <Col mobile={12}>
              <InfoContainer />
            </Col>
          </Row>
        </header>

        {hasServers || hasSchemes || hasSecurityDefinitions ? (
          <nav 
            role="navigation" 
            aria-label={t('common.authorization', 'API Configuration')} 
            className="scheme-container"
          >
            <Col className="schemes wrapper" mobile={12}>
              {hasServers || hasSchemes ? (
                <div className="schemes-server-container">
                  {hasServers ? <ServersContainer /> : null}
                  {hasSchemes ? <SchemesContainer /> : null}
                </div>
              ) : null}
              {hasSecurityDefinitions ? <AuthorizeBtnContainer /> : null}
            </Col>
          </nav>
        ) : null}

        <FilterContainer />

        <main role="main" aria-label={t('operation.summary', 'API Operations')} id="main-content">
          <div id="operations-tag">
            <Row>
              <Col mobile={12} desktop={12}>
                <Operations />
              </Col>
            </Row>
          </div>

          {isOAS31 && (
            <section 
              role="region" 
              aria-labelledby="webhooks-heading" 
              className="webhooks-container"
            >
              <Row>
                <Col mobile={12} desktop={12}>
                  <h2 id="webhooks-heading" className="sr-only">
                    {t('common.webhooks', 'Webhooks')}
                  </h2>
                  <Webhooks />
                </Col>
              </Row>
            </section>
          )}

          <aside 
            role="complementary" 
            aria-label={t('common.model', 'Schema Models')} 
            id="models"
          >
            <Row>
              <Col mobile={12} desktop={12}>
                <Models />
              </Col>
            </Row>
          </aside>
        </main>
      </VersionPragmaFilter>
    </div>
  )
}

BaseLayout.propTypes = {
  errSelectors: PropTypes.object.isRequired,
  errActions: PropTypes.object.isRequired,
  specSelectors: PropTypes.object.isRequired,
  oas3Selectors: PropTypes.object.isRequired,
  oas3Actions: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
}

export default BaseLayout