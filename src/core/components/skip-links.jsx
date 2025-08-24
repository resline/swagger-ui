import React from "react"

export default class SkipLinks extends React.Component {
  render() {
    return (
      <div className="skip-links">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#operations-tag" className="skip-link">
          Skip to operations
        </a>
        <a href="#models" className="skip-link">
          Skip to models
        </a>
      </div>
    )
  }
}