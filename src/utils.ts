export function padNumber(num: number): string {
  return num.toString().padStart(3, "0");
}

export function xmlNameToString(element: Element | null): string {
  const children = element?.children;
  if (!children) return "";

  const chars: string[] = [];
  for (let i = 0; i < children.length; i++) {
    const charCode = parseInt(children[i].textContent || "0");
    chars.push(String.fromCharCode(charCode)); // Convert ASCII code to character
  }
  return chars.join("");
}
