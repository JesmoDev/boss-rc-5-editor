import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("sortable-item")
export class SortableItem extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 10px;
      margin: 4px 0;
      background: #f0f0f0;
      border: 1px solid #ccc;
      cursor: grab;
      color: #333;
    }

    :host([dragging]) {
      opacity: 0.5;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sortable-item": SortableItem;
  }
}
