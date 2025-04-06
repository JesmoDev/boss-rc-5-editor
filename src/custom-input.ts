import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { MUIComponent } from "./component";

@customElement("custom-input")
export class CustomInput extends MUIComponent {
  @property({ type: String }) value = ""; // Define a property to hold the input value

  @state() private modifiedValue = ""; // State to hold the modified value for rendering

  onInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    let value = target.value;

    // The actual value should remain unchanged
    this.value = value.replace(/\u00A0/g, " ");

    // For rendering, replace spaces with invisible characters
    this.modifiedValue = value.replace(/ /g, "\u00A0");
  };

  render() {
    return html` <textarea maxlength="12" @input=${this.onInput} .value=${this.modifiedValue}></textarea> `;
  }

  static styles = css`
    :host {
      display: flex;
      font-family: monospace;
    }

    textarea {
      font-family: monospace;
      font-size: inherit;
      width: 6ch;
      white-space: break-spaces;
      resize: none;
      overflow: hidden;
      padding: 0.3em 0.6em;
      box-sizing: content-box;
      line-height: 1.4;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "custom-input": CustomInput;
  }
}
