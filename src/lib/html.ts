import DOMPurify from "isomorphic-dompurify";

/**
 * Decode HTML entities (named, decimal, and hex) to their Unicode characters.
 */
function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&rsquo;": "\u2019",
    "&lsquo;": "\u2018",
    "&rdquo;": "\u201D",
    "&ldquo;": "\u201C",
    "&ndash;": "\u2013",
    "&mdash;": "\u2014",
    "&nbsp;": " ",
    "&hellip;": "\u2026",
    "&trade;": "\u2122",
    "&copy;": "\u00A9",
    "&reg;": "\u00AE",
    "&times;": "\u00D7",
    "&divide;": "\u00F7",
    "&frac12;": "\u00BD",
    "&frac14;": "\u00BC",
    "&frac34;": "\u00BE",
  };
  let result = text;
  for (const [entity, char] of Object.entries(named)) {
    result = result.replaceAll(entity, char);
  }
  // Decimal entities: &#123;
  result = result.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10))
  );
  // Hex entities: &#x1F4;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return result;
}

/**
 * Strip all HTML tags and decode entities to return plain text.
 * Used for MCQ option texts that are wrapped in <td>/<p> tags.
 */
export function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, "")).trim();
}

/**
 * Sanitize HTML for safe rendering via dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
