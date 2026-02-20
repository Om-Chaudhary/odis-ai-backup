/**
 * Lightweight markdown-to-HTML converter for blog posts.
 * Handles headings, bold, italic, links, lists, blockquotes, and horizontal rules.
 * No external dependencies needed.
 */
export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inParagraph = false;

  function closeParagraph() {
    if (inParagraph) {
      output.push("</p>");
      inParagraph = false;
    }
  }

  function closeList() {
    if (inList) {
      output.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  }

  function inlineFormat(text: string): string {
    // Links: [text](url)
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-teal-600 underline hover:text-teal-700" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    // Bold + italic: ***text*** or ___text___
    text = text.replace(
      /\*\*\*(.+?)\*\*\*/g,
      "<strong><em>$1</em></strong>",
    );
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
    // Italic: *text* or _text_ (but not mid-word underscores)
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    // Empty line
    if (trimmed === "") {
      closeParagraph();
      closeList();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeParagraph();
      closeList();
      output.push('<hr class="my-8 border-slate-200" />');
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      closeParagraph();
      closeList();
      const level = headingMatch[1]!.length;
      const text = inlineFormat(headingMatch[2]!);
      const id = headingMatch[2]!
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      const styles: Record<number, string> = {
        2: "text-2xl font-bold text-slate-900 mt-10 mb-4",
        3: "text-xl font-semibold text-slate-900 mt-8 mb-3",
        4: "text-lg font-semibold text-slate-800 mt-6 mb-2",
      };
      output.push(
        `<h${level} id="${id}" class="${styles[level] ?? ""}">${text}</h${level}>`,
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      closeParagraph();
      closeList();
      const text = inlineFormat(trimmed.slice(2));
      output.push(
        `<blockquote class="border-l-4 border-teal-200 pl-4 my-4 text-slate-600 italic">${text}</blockquote>`,
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      closeParagraph();
      if (inList !== "ul") {
        closeList();
        output.push('<ul class="list-disc pl-6 my-4 space-y-2 text-slate-700">');
        inList = "ul";
      }
      const text = inlineFormat(trimmed.replace(/^[-*]\s+/, ""));
      output.push(`<li>${text}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (olMatch) {
      closeParagraph();
      if (inList !== "ol") {
        closeList();
        output.push(
          '<ol class="list-decimal pl-6 my-4 space-y-2 text-slate-700">',
        );
        inList = "ol";
      }
      const text = inlineFormat(olMatch[2]!);
      output.push(`<li>${text}</li>`);
      continue;
    }

    // Regular paragraph text
    if (inList) {
      closeList();
    }
    if (!inParagraph) {
      output.push(
        '<p class="my-4 leading-relaxed text-slate-700">',
      );
      inParagraph = true;
    } else {
      output.push(" ");
    }
    output.push(inlineFormat(trimmed));
  }

  closeParagraph();
  closeList();

  return output.join("\n");
}
