import type { ReactElement } from "react";
import { render } from "@react-email/components";

export async function renderEmailToHtml(
  component: ReactElement,
): Promise<string> {
  return await render(component);
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function inlineCss(html: string): string {
  return html;
}

export async function prepareEmailContent(component: ReactElement): Promise<{
  html: string;
  text: string;
}> {
  const html = await renderEmailToHtml(component);
  const text = htmlToPlainText(html);
  return { html, text };
}
