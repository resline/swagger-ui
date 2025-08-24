import * as wrapComponents from "./wrap-components"
import afterLoad from "./after-load"

export default function I18nPlugin(system) {
  return {
    components: {
      LanguageSelector: "LanguageSelector"
    },
    wrapComponents,
    afterLoad,
  }
}