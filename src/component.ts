import { CSSResultGroup, LitElement } from "lit";
import { resetCSS } from "./styles/reset.css.ts";
import { globalCSS } from "./styles/global.css.ts";

export abstract class MUIComponent extends LitElement {
  private static _styles: CSSResultGroup;

  static get styles(): CSSResultGroup {
    const derivedStyles = this._styles || [];
    return [resetCSS, globalCSS, ...(Array.isArray(derivedStyles) ? derivedStyles : [derivedStyles])];
  }

  static set styles(styles: CSSResultGroup) {
    this._styles = styles;
  }
}
