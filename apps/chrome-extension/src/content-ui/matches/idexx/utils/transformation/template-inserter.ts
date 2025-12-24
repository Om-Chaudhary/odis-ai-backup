import { enableEditMode } from '../dom/ckeditor-detector';
import { logger } from '@odis-ai/extension/shared';
import type { CKEditorInfo } from '../dom/ckeditor-detector';

const odisLogger = logger.child('[ODIS]');

export interface InsertTemplateOptions {
  /** Where to insert the template */
  position?: 'cursor' | 'end' | 'replace';
  /** Whether to automatically enable edit mode */
  autoEnableEditMode?: boolean;
}

/**
 * Inserts HTML template content into the CKEditor
 */
export const insertTemplate = async (
  ckeditorInfo: CKEditorInfo,
  templateHtml: string,
  options: InsertTemplateOptions = {},
): Promise<void> => {
  const { position = 'end', autoEnableEditMode = true } = options;

  try {
    // Enable edit mode if needed
    if (autoEnableEditMode && !ckeditorInfo.isInEditMode()) {
      await enableEditMode(ckeditorInfo);
      // Give the editor more time to fully initialize and load content
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!ckeditorInfo.isInEditMode()) {
      throw new Error('Editor is not in edit mode');
    }

    const contentElement = ckeditorInfo.contentElement;

    switch (position) {
      case 'replace':
        // Replace all content
        contentElement.innerHTML = templateHtml;
        odisLogger.debug('Template replaced all content');
        break;

      case 'cursor':
        // Try to insert at cursor position using document.execCommand
        // This may not work in all cases, fallback to 'end'
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const isInsideEditor = contentElement.contains(range.commonAncestorContainer);

            if (isInsideEditor) {
              range.deleteContents();
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = templateHtml;

              // Insert all nodes from template
              while (tempDiv.firstChild) {
                range.insertNode(tempDiv.firstChild);
              }

              odisLogger.debug('Template inserted at cursor');
              break;
            }
          }
        } catch (error) {
          odisLogger.warn('Failed to insert at cursor, falling back to end', { error });
        }
      // Fallthrough to 'end' if cursor insertion fails
      case 'end':
      default:
        // Append to end of content
        contentElement.insertAdjacentHTML('beforeend', templateHtml);
        odisLogger.debug('Template appended to end');
        break;
    }

    // Try to access CKEditor instance to properly notify it of changes
    try {
      // @ts-expect-error - CKEditor global might exist
      if (typeof window.CKEDITOR !== 'undefined' && window.CKEDITOR.instances) {
        // @ts-expect-error - Find the CKEditor instance
        const instances = Object.values(window.CKEDITOR.instances);
        if (instances.length > 0) {
          const editor = instances[0] as { updateElement: () => void; fire: (event: string) => void };
          // Force CKEditor to update its internal state
          editor.updateElement();
          editor.fire('change');
          odisLogger.debug('CKEditor instance notified of change');
        }
      }
    } catch (error) {
      odisLogger.warn('Could not access CKEditor instance', { error });
    }

    // Trigger DOM events as backup
    contentElement.dispatchEvent(new Event('input', { bubbles: true }));
    contentElement.dispatchEvent(new Event('change', { bubbles: true }));

    // Focus the content element to ensure it's active
    contentElement.focus();

    // Scroll to bottom if appended
    if (position === 'end') {
      contentElement.scrollTop = contentElement.scrollHeight;
    }
  } catch (error) {
    odisLogger.error('Failed to insert template', { error });
    throw error;
  }
};

/**
 * Gets the current cursor position info
 */
export const getCursorPosition = (
  ckeditorInfo: CKEditorInfo,
): {
  hasSelection: boolean;
  isInEditor: boolean;
} => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { hasSelection: false, isInEditor: false };
  }

  const range = selection.getRangeAt(0);
  const isInEditor = ckeditorInfo.contentElement.contains(range.commonAncestorContainer);

  return {
    hasSelection: true,
    isInEditor,
  };
};
