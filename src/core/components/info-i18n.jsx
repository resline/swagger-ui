/**
 * @prettier
 */
import React from "react"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import { useTranslation } from "react-i18next"
import { safeBuildUrl, sanitizeUrl } from "core/utils/url"

export const InfoBasePath = ({ host, basePath }) => {
  const { t } = useTranslation()

  return (
    <pre className="base-url">
      [ {t('common.baseUrl')}: {host}
      {basePath} ]
    </pre>
  )
}

InfoBasePath.propTypes = {
  host: PropTypes.string,
  basePath: PropTypes.string,
}

export const InfoUrl = ({ url, getComponent }) => {
  const Link = getComponent("Link")

  return (
    <Link target="_blank" href={sanitizeUrl(url)}>
      <span className="url"> {url}</span>
    </Link>
  )
}

InfoUrl.propTypes = {
  url: PropTypes.string.isRequired,
  getComponent: PropTypes.func.isRequired,
}

const Info = ({ 
  info,
  url,
  host,
  basePath,
  getComponent,
  externalDocs,
  selectedServer,
  url: specUrl 
}) => {
  const { t } = useTranslation()
  
  const version = info.get("version")
  const description = info.get("description")
  const title = info.get("title")
  const termsOfServiceUrl = safeBuildUrl(
    info.get("termsOfService"),
    specUrl,
    { selectedServer }
  )
  const contactData = info.get("contact")
  const licenseData = info.get("license")
  const rawExternalDocsUrl = externalDocs && externalDocs.get("url")
  const externalDocsUrl = safeBuildUrl(rawExternalDocsUrl, specUrl, {
    selectedServer,
  })
  const externalDocsDescription =
    externalDocs && externalDocs.get("description")

  const Markdown = getComponent("Markdown", true)
  const Link = getComponent("Link")
  const VersionStamp = getComponent("VersionStamp")
  const OpenAPIVersion = getComponent("OpenAPIVersion")
  const InfoUrl = getComponent("InfoUrl")
  const InfoBasePath = getComponent("InfoBasePath")
  const License = getComponent("License")
  const Contact = getComponent("Contact")

  return (
    <div className="info">
      <hgroup className="main">
        <h2 className="title">
          {title}
          <span>
            {version && <VersionStamp version={version} />}
            <OpenAPIVersion oasVersion="2.0" />
          </span>
        </h2>
        {host || basePath ? (
          <InfoBasePath host={host} basePath={basePath} />
        ) : null}
        {url && <InfoUrl getComponent={getComponent} url={url} />}
      </hgroup>

      <div className="description">
        <Markdown source={description} />
      </div>

      {termsOfServiceUrl && (
        <div className="info__tos">
          <Link target="_blank" href={sanitizeUrl(termsOfServiceUrl)}>
            {t('common.termsOfService')}
          </Link>
        </div>
      )}

      {contactData?.size > 0 && (
        <Contact
          getComponent={getComponent}
          data={contactData}
          selectedServer={selectedServer}
          url={url}
        />
      )}
      {licenseData?.size > 0 && (
        <License
          getComponent={getComponent}
          license={licenseData}
          selectedServer={selectedServer}
          url={url}
        />
      )}
      {externalDocsUrl ? (
        <Link
          className="info__extdocs"
          target="_blank"
          href={sanitizeUrl(externalDocsUrl)}
        >
          {externalDocsDescription || externalDocsUrl}
        </Link>
      ) : null}
    </div>
  )
}

Info.propTypes = {
  title: PropTypes.any,
  description: PropTypes.any,
  version: PropTypes.any,
  info: PropTypes.object,
  url: PropTypes.string,
  host: PropTypes.string,
  basePath: PropTypes.string,
  externalDocs: ImPropTypes.map,
  getComponent: PropTypes.func.isRequired,
  oas3selectors: PropTypes.func,
  selectedServer: PropTypes.string,
}

export default Info