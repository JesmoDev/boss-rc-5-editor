import { LitElement, html, css } from "lit";
import { customElement, queryAssignedElements } from "lit/decorators.js";

@customElement("sortable-container")
export class SortableContainer extends LitElement {
  @queryAssignedElements()
  items!: HTMLElement[];

  // static styles = css`
  //   :host {
  //     display: block;
  //     border: 2px dashed #aaa;
  //     padding: 10px;
  //     min-height: 100px;
  //   }
  // `;

  private dragSrcEl: HTMLElement | null = null;
  private startIndex: number | null = null;
  private endIndex: number | null = null;

  firstUpdated() {
    this.addDragAndDropHandlers();
  }

  private flip2(elements: HTMLElement[]) {
    const firstRects = new Map<HTMLElement, DOMRect>();
    elements.forEach((el) => firstRects.set(el, el.getBoundingClientRect()));

    requestAnimationFrame(() => {
      elements.forEach((el) => {
        const firstRect = firstRects.get(el);
        const lastRect = el.getBoundingClientRect();
        if (!firstRect) return;

        const dx = firstRect.left - lastRect.left;
        const dy = firstRect.top - lastRect.top;

        if (dx !== 0 || dy !== 0) {
          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.getBoundingClientRect(); // Force reflow
          el.style.transition = "transform 200ms ease";
          el.style.transform = "";
        }
      });
    });
  }

  private addDragAndDropHandlers() {
    this.items.forEach((item) => {
      item.setAttribute("draggable", "true");

      item.addEventListener("dragstart", (e: DragEvent) => {
        this.dragSrcEl = item;
        item.style.zIndex = "1000";
        item.setAttribute("dragging", "");
        e.dataTransfer?.setData("text/plain", "");
        this.startIndex = Array.from(this.items).indexOf(item);
      });

      item.addEventListener("dragend", () => {
        item.removeAttribute("dragging");
        item.style.zIndex = "";
        this.dragSrcEl = null;
        this.endIndex = Array.from(this.items).indexOf(item);

        if (this.startIndex !== null && this.endIndex !== null && this.startIndex !== this.endIndex) {
          const event = new CustomEvent("change", {
            detail: { startIndex: this.startIndex, endIndex: this.endIndex },
          });
          this.dispatchEvent(event);
        }
      });

      item.addEventListener("dragover", (e: DragEvent) => {
        e.preventDefault();
        const dragging = this.dragSrcEl;
        if (!dragging || dragging === item) return;

        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isAbove = e.clientY < midY;

        const container = this.shadowRoot?.host as HTMLElement;
        const parent = container.shadowRoot?.host || container;

        if ((isAbove && dragging.nextElementSibling === item) || (!isAbove && dragging.previousElementSibling === item)) {
          return;
        }

        // Trigger flip animation
        this.flip2([dragging, item]);

        if (isAbove) {
          parent.insertBefore(dragging, item);
        } else {
          parent.insertBefore(dragging, item.nextSibling);
        }
      });
    });
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sortable-container": SortableContainer;
  }
}
