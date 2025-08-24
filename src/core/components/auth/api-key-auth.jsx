import React from "react"
import PropTypes from "prop-types"
import { validateApiKey, sanitizeString } from "core/utils/validation"

export default class ApiKeyAuth extends React.Component {
  static propTypes = {
    authorized: PropTypes.object,
    getComponent: PropTypes.func.isRequired,
    errSelectors: PropTypes.object.isRequired,
    schema: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    authSelectors: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
    let { name, schema } = this.props
    let value = this.getValue()

    this.state = {
      name: name,
      schema: schema,
      value: value,
      validationErrors: [],
      isValidating: false
    }
  }

  getValue () {
    let { name, authorized } = this.props

    return authorized && authorized.getIn([name, "value"])
  }

  onChange =(e) => {
    let { onChange } = this.props
    let rawValue = e.target.value
    
    // Sanitize the input first
    let sanitizedValue = sanitizeString(rawValue, { 
      trim: false, // Don't trim while typing
      maxLength: 128,
      removeScripts: true 
    })
    
    // Validate the sanitized value
    this.setState({ isValidating: true })
    
    const validationResult = validateApiKey(sanitizedValue)
    const validationErrors = validationResult.isValid ? [] : validationResult.errors
    
    let newState = Object.assign({}, this.state, { 
      value: sanitizedValue,
      validationErrors: validationErrors,
      isValidating: false 
    })

    this.setState(newState)
    
    // Only pass valid values to parent
    if (validationResult.isValid) {
      onChange({
        ...newState,
        value: validationResult.sanitized
      })
    }
  }

  render() {
    let { schema, getComponent, errSelectors, name, authSelectors } = this.props
    const Input = getComponent("Input")
    const Row = getComponent("Row")
    const Col = getComponent("Col")
    const AuthError = getComponent("authError")
    const Markdown = getComponent("Markdown", true)
    const JumpToPath = getComponent("JumpToPath", true)
    const path = authSelectors.selectAuthPath(name)
    let value = this.getValue()
    let errors = errSelectors.allErrors().filter( err => err.get("authId") === name)
    
    // Combine validation errors with existing errors
    const { validationErrors, isValidating } = this.state
    const hasValidationErrors = validationErrors.length > 0

    return (
      <div>
        <h4>
          <code>{ name || schema.get("name") }</code>&nbsp;(apiKey)
          <JumpToPath path={path} />
        </h4>
        { value && <h6>Authorized</h6>}
        <Row>
          <Markdown source={ schema.get("description") } />
        </Row>
        <Row>
          <p>Name: <code>{ schema.get("name") }</code></p>
        </Row>
        <Row>
          <p>In: <code>{ schema.get("in") }</code></p>
        </Row>
        <Row>
          <label htmlFor="api_key_value">Value:</label>
          {
            value ? <code> ****** </code>
                  : <Col>
                      <Input 
                        id="api_key_value" 
                        type="text" 
                        onChange={ this.onChange } 
                        autoFocus
                        style={{ 
                          borderColor: hasValidationErrors ? '#f5222d' : undefined,
                          backgroundColor: isValidating ? '#f0f0f0' : undefined 
                        }}
                      />
                    </Col>
          }
        </Row>
        {
          errors.valueSeq().map( (error, key) => {
            return <AuthError error={ error }
                              key={ key }/>
          } )
        }
        {
          validationErrors.map( (errorMsg, idx) => {
            return <div key={`validation-${idx}`} style={{ color: '#f5222d', fontSize: '12px', marginTop: '4px' }}>
                     <strong>Validation Error:</strong> {errorMsg}
                   </div>
          } )
        }
      </div>
    )
  }
}
