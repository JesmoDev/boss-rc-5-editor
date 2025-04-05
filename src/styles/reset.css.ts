import { css } from "lit";

export const resetCSS = css`
  /*
  1. Use a more-intuitive box-sizing model.
*/
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  /*
  2. Remove default margin
*/
  * {
    margin: 0;
    line-height: calc(1em + 0.5rem);
  }
  /*
  5. Improve media defaults
*/
  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
  }
  /*
  6. Remove built-in form typography styles
*/
  input,
  button,
  textarea,
  select {
    font: inherit;
  }
  /*
  7. Avoid text overflows
*/
  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    overflow-wrap: break-word;
  }

  /* Hide the spin buttons in Chrome, Safari, and Edge */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Hide the spin buttons in Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
  }
  a {
    text-decoration: none;
    color: #4280ff;
  }
`;
