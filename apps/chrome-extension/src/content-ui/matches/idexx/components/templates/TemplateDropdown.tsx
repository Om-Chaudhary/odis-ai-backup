import { insertTemplate } from '../../utils/transformation/template-inserter';
import { useStorage, logger, trackEvent } from '@odis-ai/extension-shared';
import { soapTemplatesStorage } from '@odis-ai/extension-storage';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CKEditorInfo } from '../../utils/dom/ckeditor-detector';
import type { SOAPTemplate } from '@odis-ai/extension-storage';

const odisLogger = logger.child('[ODIS]');

interface TemplateDropdownProps {
  ckeditorInfo: CKEditorInfo;
  onClose: () => void;
}

export const TemplateDropdown = ({ ckeditorInfo, onClose }: TemplateDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const storage = useStorage(soapTemplatesStorage);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInserting, setIsInserting] = useState(false);

  // Create and insert container into DOM above the Notes section
  useEffect(() => {
    if (!ckeditorInfo?.editorElement) {
      // Silently skip if CKEditor not available (happens during edit mode transitions)
      return;
    }

    // Find the Notes section container
    const notesSection = ckeditorInfo.editorElement.closest('.cke') as HTMLElement;
    if (!notesSection) {
      return;
    }

    // Create container div
    const container = document.createElement('div');
    container.id = 'odis-template-dropdown-container';
    container.style.cssText = 'margin-bottom: 10px;';

    // Insert before the Notes section
    notesSection.parentElement?.insertBefore(container, notesSection);
    containerRef.current = container;

    return () => {
      // Clean up on unmount
      if (container.parentElement) {
        container.remove();
      }
      containerRef.current = null;
    };
  }, [ckeditorInfo]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleTemplateSelect = async (template: SOAPTemplate) => {
    try {
      setIsInserting(true);
      await insertTemplate(ckeditorInfo, template.content, {
        position: 'end',
        autoEnableEditMode: true,
      });
      odisLogger.info('Template inserted', { templateName: template.name });

      // Track template insertion
      await trackEvent(
        {
          event_type: 'template_inserted',
          event_category: 'template',
          event_action: 'insert',
          source: 'idexx_extension',
          success: true,
          metadata: {
            template_name: template.name,
            template_category: template.category,
            template_id: template.id,
            is_default: template.isDefault || false,
          },
        },
        { trackFeatureUsage: true, updateSession: true },
      );

      onClose();
    } catch (error) {
      odisLogger.error('Failed to insert template', { error });

      // Track failed template insertion
      await trackEvent(
        {
          event_type: 'template_inserted',
          event_category: 'template',
          event_action: 'insert',
          source: 'idexx_extension',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            template_name: template.name,
            template_category: template.category,
            template_id: template.id,
          },
        },
        { trackFeatureUsage: false, updateSession: false },
      );

      alert('Failed to insert template. Please ensure the editor is in edit mode.');
    } finally {
      setIsInserting(false);
    }
  };

  // Group templates by category
  const templatesByCategory = (storage?.templates || []).reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    },
    {} as Record<string, SOAPTemplate[]>,
  );

  // Filter templates by search query
  const filteredTemplatesByCategory = Object.entries(templatesByCategory).reduce(
    (acc, [category, templates]) => {
      const filtered = templates.filter(
        template =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, SOAPTemplate[]>,
  );

  const hasTemplates = Object.keys(filteredTemplatesByCategory).length > 0;

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        maxHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
      {/* Header with branding */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
          color: 'white',
          borderRadius: '4px 4px 0 0',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="20" height="20" rx="4" fill="white" fillOpacity="0.2" />
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="white"
              fontFamily="system-ui, -apple-system, sans-serif">
              AI
            </text>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>ODIS AI Templates</span>
        </div>

        {/* Search box */}
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            fontSize: '13px',
            outline: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#333',
          }}
        />
      </div>

      {/* Templates list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}>
        {!hasTemplates && (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '13px',
            }}>
            {searchQuery ? 'No templates found' : 'No templates available'}
          </div>
        )}

        {Object.entries(filteredTemplatesByCategory).map(([category, templates]) => (
          <div key={category} style={{ marginBottom: '8px' }}>
            <div
              style={{
                padding: '6px 16px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
              {category}
            </div>
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                disabled={isInserting}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  cursor: isInserting ? 'wait' : 'pointer',
                  transition: 'background-color 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  opacity: isInserting ? 0.6 : 1,
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (!isInserting) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                  <span>{template.name}</span>
                  {template.isDefault && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        borderRadius: '3px',
                        fontWeight: '600',
                      }}>
                      DEFAULT
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.4',
                  }}>
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
        }}>
        Powered by ODIS AI
      </div>
    </div>
  );

  // Render dropdown using portal to container inserted in page DOM
  if (!containerRef.current) {
    return null;
  }

  return createPortal(dropdownContent, containerRef.current);
};
