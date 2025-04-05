import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "./editor"; // Import the editor component
import { MUIComponent } from "./component";

@customElement("mui-app")
export class MuiApp extends MUIComponent {
  render() {
    return html`<mui-editor></mui-editor> `;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "mui-app": MuiApp;
  }
}
