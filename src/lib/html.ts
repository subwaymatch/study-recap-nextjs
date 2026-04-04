import DOMPurify from "isomorphic-dompurify";

/**
 * Strip all HTML tags and return plain text.
 * Used for MCQ option texts that are wrapped in <td>/<p> tags.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Sanitize HTML for safe rendering via dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
