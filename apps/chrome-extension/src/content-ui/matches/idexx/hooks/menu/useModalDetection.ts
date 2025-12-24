import { useEffect, useState } from "react";

/**
 * Hook for detecting modals/overlays and hiding menu bar when present
 */
export const useModalDetection = (): boolean => {
  const [shouldHideForModal, setShouldHideForModal] = useState(false);

  useEffect(() => {
    const checkForModals = () => {
      // Check if body has modal-open class (common pattern in many UI frameworks)
      const bodyHasModalClass =
        document.body.classList.contains("modal-open") ||
        document.body.classList.contains("spot-modal-open") ||
        document.body.classList.contains("overlay-open");

      // Check for visible modal elements with ARIA dialog role
      const hasDialogModal =
        document.querySelector('[role="dialog"]:not([aria-hidden="true"])') !==
          null ||
        document.querySelector(
          '[role="alertdialog"]:not([aria-hidden="true"])',
        ) !== null;

      // Check for modal overlay elements that are visible
      const hasModalOverlay =
        document.querySelector(".modal.show") !== null ||
        document.querySelector(".spot-modal__overlay--visible") !== null ||
        document.querySelector(".modal-backdrop.show") !== null;

      // Use a slightly more conservative check - only hide if a modal is definitely blocking
      // Previously this might have been too aggressive
      setShouldHideForModal(
        bodyHasModalClass || hasDialogModal || hasModalOverlay,
      );
    };

    // Initial check
    checkForModals();

    // Create a MutationObserver to watch for DOM changes (especially body class changes)
    const observer = new MutationObserver(() => {
      checkForModals();
    });

    // Observe changes to the body and document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "aria-hidden"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return shouldHideForModal;
};
