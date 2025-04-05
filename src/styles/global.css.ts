import { css } from "lit";

export const globalCSS = css`
  textarea,
  input,
  button {
    background-color: var(--color-background);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  button {
    background-color: var(--color-button-background);
    color: var(--color-button-text);
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }
`;
