import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip?: string;
}> = ({ onClick, isActive, disabled, children, tooltip }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`rounded-md p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 ${isActive ? 'border-2 border-[#5ab9b4] bg-[#5ab9b4]/15 text-[#5ab9b4] shadow-sm' : ''} `}
    type="button">
    {children}
  </button>
);

const Divider = () => <div className="mx-1 h-6 w-px bg-gray-300" />;

const ToolbarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-1">{children}</div>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onBlur,
  placeholder = 'Start typing...',
  editable = true,
  className,
}) => {
  // Convert plain text to HTML, preserving line breaks and basic markdown
  const convertToHTML = (text: string): string => {
    if (!text) return '';

    // If it's already HTML (contains tags), return as-is
    if (text.includes('<p>') || text.includes('<br>') || text.includes('<div>')) {
      return text;
    }

    // Convert plain text to HTML
    // 1. Replace double line breaks with paragraph breaks
    // 2. Replace single line breaks with <br>
    // 3. Convert **text** to <strong>text</strong>
    const html = text
      // First, handle **bold** markdown syntax
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Split by double line breaks to create paragraphs
      .split('\n\n')
      .map(para => {
        // Within each paragraph, convert single line breaks to <br>
        const withBreaks = para.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      })
      .join('');

    return html;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Preserve hard breaks
        hardBreak: {
          keepMarks: true,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: convertToHTML(content),
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      if (onBlur) {
        onBlur();
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-6 text-gray-900',
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      const htmlContent = convertToHTML(content);
      if (htmlContent !== editor.getHTML()) {
        editor.commands.setContent(htmlContent);
      }
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`flex h-full flex-col border-0 bg-white ${className || ''}`}>
      {editable && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white p-2">
          {/* History Group */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              tooltip="Undo (Ctrl+Z)">
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              tooltip="Redo (Ctrl+Y)">
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <Divider />

          {/* Headings Group */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              tooltip="Heading 1 (Ctrl+Alt+1)">
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              tooltip="Heading 2 (Ctrl+Alt+2)">
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              tooltip="Heading 3 (Ctrl+Alt+3)">
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <Divider />

          {/* Text Formatting Group */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              tooltip="Bold (Ctrl+B)">
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              tooltip="Italic (Ctrl+I)">
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              tooltip="Underline (Ctrl+U)">
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <Divider />

          {/* Lists Group */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              tooltip="Bullet List (Ctrl+Shift+8)">
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              tooltip="Numbered List (Ctrl+Shift+7)">
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <Divider />

          {/* Alignment Group */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              tooltip="Align Left (Ctrl+Shift+L)">
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              tooltip="Align Center (Ctrl+Shift+E)">
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              tooltip="Align Right (Ctrl+Shift+R)">
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
