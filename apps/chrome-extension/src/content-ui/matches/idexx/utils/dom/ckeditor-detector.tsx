import { logger } from '@odis-ai/extension-shared';
import { createRoot } from 'react-dom/client';
import type { FC } from 'react';

const odisLogger = logger.child('[ODIS]');

export interface CKEditorInfo {
  editorElement: HTMLElement;
  toolbarElement: HTMLElement;
  contentElement: HTMLElement;
  editButton: HTMLElement | null;
  isInEditMode: () => boolean;
}

/**
 * Detects CKEditor instance on the IDEXX Neo page
 */
export const detectCKEditor = (): CKEditorInfo | null => {
  // Look for CKEditor wrapper
  const editorElement = document.querySelector('.cke') as HTMLElement;
  if (!editorElement) {
    odisLogger.debug('CKEditor not found yet (selector: .cke)...');
    return null;
  }

  // Get toolbar element
  const toolbarElement = editorElement.querySelector('.cke_top .cke_toolbox') as HTMLElement;
  if (!toolbarElement) {
    odisLogger.warn('CKEditor toolbar not found (selector: .cke_top .cke_toolbox)');
    return null;
  }

  // Get content editable element
  const contentElement = editorElement.querySelector('.cke_wysiwyg_div') as HTMLElement;
  if (!contentElement) {
    odisLogger.warn('CKEditor content area not found (selector: .cke_wysiwyg_div)');
    return null;
  }

  // Find the Edit Notes button
  const editButton = document.querySelector('[data-qa="edit-notes-button"] button') as HTMLElement;

  const isInEditMode = () => contentElement.getAttribute('contenteditable') === 'true';

  odisLogger.info('CKEditor detected successfully', {
    isInEditMode: isInEditMode(),
    hasEditButton: !!editButton,
  });

  return {
    editorElement,
    toolbarElement,
    contentElement,
    editButton,
    isInEditMode,
  };
};

/**
 * Enables edit mode by clicking the Edit Notes button
 */
export const enableEditMode = (editorInfo: CKEditorInfo): Promise<void> =>
  new Promise((resolve, reject) => {
    if (editorInfo.isInEditMode()) {
      resolve();
      return;
    }

    if (!editorInfo.editButton) {
      reject(new Error('Edit Notes button not found'));
      return;
    }

    odisLogger.debug('Enabling edit mode...');

    // Click the Edit Notes button
    editorInfo.editButton.click();

    // Wait for edit mode to activate
    const checkEditMode = setInterval(() => {
      if (editorInfo.isInEditMode()) {
        clearInterval(checkEditMode);
        odisLogger.debug('Edit mode enabled');
        resolve();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkEditMode);
      if (!editorInfo.isInEditMode()) {
        reject(new Error('Failed to enable edit mode'));
      }
    }, 5000);
  });

/**
 * Injects a React component as a button into the CKEditor toolbar
 */
export const injectToolbarButton = (
  ckeditorElement: HTMLElement | CKEditorInfo,
  ButtonComponent: FC<{ ckeditorInfo: CKEditorInfo }>,
): (() => void) | null => {
  const editorInfo = 'toolbarElement' in ckeditorElement ? ckeditorElement : detectCKEditor();

  if (!editorInfo) {
    odisLogger.warn('Cannot inject button: CKEditor not found');
    return null;
  }

  // Find the last toolbar row (where custom buttons should go)
  const toolbarRows = editorInfo.toolbarElement.querySelectorAll('.cke_toolbar');
  if (toolbarRows.length === 0) {
    odisLogger.warn('No toolbar rows found');
    return null;
  }

  const lastToolbarRow = toolbarRows[toolbarRows.length - 1];

  // Create container for our button
  const buttonContainer = document.createElement('span');
  buttonContainer.className = 'cke_toolgroup';
  buttonContainer.id = 'odis-template-button-container';
  buttonContainer.setAttribute('role', 'presentation');

  // Insert at the beginning of the last toolbar row
  const firstToolgroup = lastToolbarRow.querySelector('.cke_toolgroup');
  if (firstToolgroup) {
    lastToolbarRow.insertBefore(buttonContainer, firstToolgroup);
  } else {
    lastToolbarRow.appendChild(buttonContainer);
  }

  // Render React component into the container
  const root = createRoot(buttonContainer);
  root.render(<ButtonComponent ckeditorInfo={editorInfo} />);

  odisLogger.info('Template button injected into toolbar');

  // Return cleanup function
  return () => {
    root.unmount();
    buttonContainer.remove();
  };
};

/**
 * Injects a branded menu bar inline with the consultation tabs
 * Right edge aligned with the Edit Notes button
 */
export const injectBrandedMenuBar = (
  ckeditorElement: HTMLElement | CKEditorInfo,
  MenuBarComponent: FC<{ ckeditorInfo: CKEditorInfo }>,
): (() => void) | null => {
  const editorInfo = 'toolbarElement' in ckeditorElement ? ckeditorElement : detectCKEditor();

  if (!editorInfo) {
    odisLogger.warn('Cannot inject menu bar: CKEditor not found');
    return null;
  }

  odisLogger.info('Attempting to inject BrandedMenuBar inline with tabs...');

  // Create container for our menu bar
  const menuBarContainer = document.createElement('div');
  menuBarContainer.id = 'odis-branded-menu-bar';

  // Try to find the consultation tabs controls area (preferred location)
  const tabsControls = document.querySelector('[data-qa="consultation-tabs-controls"]') as HTMLElement;

  // Find the edit-notes-button to align with its right edge
  const editNotesButton = document.querySelector('[data-qa="edit-notes-button"]') as HTMLElement;

  if (tabsControls && editNotesButton) {
    // Calculate the right edge position of the edit-notes-button relative to tabs controls
    const tabsControlsRect = tabsControls.getBoundingClientRect();
    const editButtonRect = editNotesButton.getBoundingClientRect();
    const rightOffset = tabsControlsRect.right - editButtonRect.right;

    // Style for inline display - position to align right edge with edit-notes-button
    menuBarContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-left: auto;
      margin-right: ${rightOffset}px;
      padding: 0 8px;
      z-index: 100;
      flex-shrink: 0;
    `;

    // Insert into the tabs controls area
    tabsControls.insertBefore(menuBarContainer, tabsControls.firstChild);
    odisLogger.info('Menu bar injected into consultation-tabs-controls, aligned with edit-notes-button', {
      rightOffset,
    });
  } else if (tabsControls) {
    // Fallback: no edit button found, use default positioning
    menuBarContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-left: auto;
      padding: 0 8px;
      z-index: 100;
      flex-shrink: 0;
    `;
    tabsControls.insertBefore(menuBarContainer, tabsControls.firstChild);
    odisLogger.info('Menu bar injected into consultation-tabs-controls (no edit button for alignment)');
  } else {
    // Fallback: find the tabs row and append to it
    const tabsRow = document.querySelector('.spot-flex-row.spot-flex-stretch') as HTMLElement;
    menuBarContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-left: auto;
      padding: 0 8px;
      z-index: 100;
      flex-shrink: 0;
    `;
    if (tabsRow) {
      tabsRow.appendChild(menuBarContainer);
      odisLogger.info('Menu bar injected into tabs row');
    } else {
      // Last fallback: insert before CKEditor
      const parentElement = editorInfo.editorElement.parentElement;
      if (!parentElement) {
        odisLogger.warn('Could not find suitable injection point');
        return null;
      }
      parentElement.insertBefore(menuBarContainer, editorInfo.editorElement);
      odisLogger.info('Menu bar injected before CKEditor (fallback)');
    }
  }

  // Render React component into the container
  const root = createRoot(menuBarContainer);

  try {
    root.render(<MenuBarComponent ckeditorInfo={editorInfo} />);
    odisLogger.info('Branded menu bar rendered into DOM');
  } catch (error) {
    odisLogger.error('Failed to render BrandedMenuBar component', { error });
  }

  // Return cleanup function
  return () => {
    root.unmount();
    menuBarContainer.remove();
  };
};
