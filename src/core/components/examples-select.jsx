/**
 * @prettier
 */

import React from "react"
import { Map } from "immutable"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"

export default class ExamplesSelect extends React.PureComponent {
  static propTypes = {
    examples: ImPropTypes.map.isRequired,
    onSelect: PropTypes.func,
    currentExampleKey: PropTypes.string,
    isModifiedValueAvailable: PropTypes.bool,
    isValueModified: PropTypes.bool,
    showLabels: PropTypes.bool,
  }

  static defaultProps = {
    examples: Map({}),
    onSelect: () => {
      // No-op default callback
    },
    currentExampleKey: null,
    showLabels: true,
  }

  _onSelect = (key, { isSyntheticChange = false } = {}) => {
    if (typeof this.props.onSelect === "function") {
      this.props.onSelect(key, {
        isSyntheticChange,
      })
    }
  }

  _onDomSelect = (e) => {
    if (typeof this.props.onSelect === "function") {
      const element = e.target.selectedOptions[0]
      const key = element.getAttribute("value")

      this._onSelect(key, {
        isSyntheticChange: false,
      })
    }
  }

  getCurrentExample = () => {
    const { examples, currentExampleKey } = this.props

    const currentExamplePerProps = examples.get(currentExampleKey)

    const firstExamplesKey = examples.keySeq().first()
    const firstExample = examples.get(firstExamplesKey)

    return currentExamplePerProps || firstExample || Map({})
  }

  componentDidMount() {
    // this is the not-so-great part of ExamplesSelect... here we're
    // artificially kicking off an onSelect event in order to set a default
    // value in state. the consumer has the option to avoid this by checking
    // `isSyntheticEvent`, but we should really be doing this in a selector.
    // Set default example selection on component mount
    // Note: Consider checking if currentExampleKey is already set
    const { onSelect, examples } = this.props

    if (typeof onSelect === "function") {
      const firstExample = examples.first()
      const firstExampleKey = examples.keyOf(firstExample)

      this._onSelect(firstExampleKey, {
        isSyntheticChange: true,
      })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { currentExampleKey, examples } = nextProps
    if (examples !== this.props.examples && !examples.has(currentExampleKey)) {
      // examples have changed from under us, and the currentExampleKey is no longer
      // valid.
      const firstExample = examples.first()
      const firstExampleKey = examples.keyOf(firstExample)

      this._onSelect(firstExampleKey, {
        isSyntheticChange: true,
      })
    }
  }

  render() {
    const {
      examples,
      currentExampleKey,
      isValueModified,
      isModifiedValueAvailable,
      showLabels,
    } = this.props

    return (
      <div className="examples-select">
        {showLabels ? (
          <span className="examples-select__section-label">Examples: </span>
        ) : null}
        <select
          className="examples-select-element"
          onChange={this._onDomSelect}
          value={
            isModifiedValueAvailable && isValueModified
              ? "__MODIFIED__VALUE__"
              : currentExampleKey || ""
          }
        >
          {isModifiedValueAvailable ? (
            <option value="__MODIFIED__VALUE__">[Modified value]</option>
          ) : null}
          {examples
            .map((example, exampleName) => {
              return (
                <option
                  key={exampleName} // for React
                  value={exampleName} // for matching to select's `value`
                >
                  {(Map.isMap(example) && example.get("summary")) ||
                    exampleName}
                </option>
              )
            })
            .valueSeq()}
        </select>
      </div>
    )
  }
}
