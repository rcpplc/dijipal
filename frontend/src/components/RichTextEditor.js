import React, { useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Link,
  Type,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Indent,
  Outdent,
  Table,
  Image
} from 'lucide-react';

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Açıklama yazın...', 
  minHeight = '120px',
  style = {} 
}) => {
  const editorRef = useRef(null);

  // Command execution function
  const executeCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    // Update parent component with new content
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Handle input changes
  const handleInput = useCallback((e) => {
    if (onChange) {
      onChange(e.target.innerHTML);
    }
  }, [onChange]);

  // Handle paste to clean up formatting
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Initialize content
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Insert table function
  const insertTable = useCallback(() => {
    const rows = prompt('Satır sayısı:', '3');
    const cols = prompt('Sütun sayısı:', '3');
    
    if (rows && cols) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      
      document.execCommand('insertHTML', false, tableHTML);
      if (editorRef.current && onChange) {
        onChange(editorRef.current.innerHTML);
      }
    }
  }, [onChange]);

  // Insert image function
  const insertImage = useCallback(() => {
    const url = prompt('Resim URL giriniz:');
    if (url) {
      const alt = prompt('Alternatif metin (opsiyonel):', '') || 'Resim';
      const imageHTML = `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      document.execCommand('insertHTML', false, imageHTML);
      if (editorRef.current && onChange) {
        onChange(editorRef.current.innerHTML);
      }
    }
  }, [onChange]);

  // Insert horizontal line
  const insertHR = useCallback(() => {
    document.execCommand('insertHTML', false, '<hr style="margin: 10px 0; border: none; border-top: 2px solid #ddd;" />');
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Insert blockquote
  const insertQuote = useCallback(() => {
    executeCommand('formatBlock', 'blockquote');
  }, [executeCommand]);

  const toolbarButtons = [
    {
      icon: Bold,
      command: 'bold',
      title: 'Kalın (Ctrl+B)'
    },
    {
      icon: Italic,
      command: 'italic',
      title: 'İtalik (Ctrl+I)'
    },
    {
      icon: Underline,
      command: 'underline',
      title: 'Altı Çizili (Ctrl+U)'
    },
    {
      icon: List,
      command: 'insertUnorderedList',
      title: 'Madde İşareti'
    },
    {
      icon: ListOrdered,
      command: 'insertOrderedList',
      title: 'Numaralı Liste'
    },
    {
      icon: Quote,
      command: insertQuote,
      title: 'Alıntı'
    }
  ];

  const alignmentButtons = [
    {
      icon: AlignLeft,
      command: 'justifyLeft',
      title: 'Sola Hizala'
    },
    {
      icon: AlignCenter,
      command: 'justifyCenter',
      title: 'Ortaya Hizala'
    },
    {
      icon: AlignRight,
      command: 'justifyRight',
      title: 'Sağa Hizala'
    }
  ];

  const indentButtons = [
    {
      icon: Outdent,
      command: 'outdent',
      title: 'Girintiyi Azalt'
    },
    {
      icon: Indent,
      command: 'indent',
      title: 'Girintiyi Artır'
    }
  ];

  const insertButtons = [
    {
      icon: Minus,
      command: insertHR,
      title: 'Yatay Çizgi'
    },
    {
      icon: Table,
      command: insertTable,
      title: 'Tablo Ekle'
    },
    {
      icon: Image,
      command: insertImage,
      title: 'Resim Ekle'
    }
  ];

  return (
    <div 
      className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white"
      style={style}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 flex items-center flex-wrap gap-1">
        {/* Format Buttons */}
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (typeof button.command === 'function') {
                  button.command();
                } else {
                  executeCommand(button.command);
                }
              }}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title={button.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        {/* Alignment Buttons */}
        {alignmentButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={`align-${index}`}
              type="button"
              onClick={() => executeCommand(button.command)}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title={button.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Indent Buttons */}
        {indentButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={`indent-${index}`}
              type="button"
              onClick={() => executeCommand(button.command)}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title={button.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}

        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        {/* Header dropdown */}
        <select 
          onChange={(e) => {
            if (e.target.value) {
              executeCommand('formatBlock', e.target.value);
              e.target.value = '';
            }
          }}
          className="text-sm border-none bg-transparent text-gray-600 focus:outline-none px-2 py-1"
          defaultValue=""
        >
          <option value="" disabled>Başlık</option>
          <option value="h1">Başlık 1</option>
          <option value="h2">Başlık 2</option>
          <option value="h3">Başlık 3</option>
          <option value="p">Paragraf</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link button */}
        <button
          type="button"
          onClick={() => {
            const url = prompt('Link URL giriniz:');
            if (url) {
              executeCommand('createLink', url);
            }
          }}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Link Ekle"
        >
          <Link className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Insert Buttons */}
        {insertButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={`insert-${index}`}
              type="button"
              onClick={() => {
                if (typeof button.command === 'function') {
                  button.command();
                } else {
                  executeCommand(button.command);
                }
              }}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title={button.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="px-4 py-3 focus:outline-none text-gray-700 leading-relaxed"
        style={{ 
          minHeight: minHeight,
          maxHeight: '300px',
          overflowY: 'auto'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Custom styles for placeholder and content */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
        }
        [contenteditable] h1 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.3;
        }
        [contenteditable] h2 {
          font-size: 1.3em;
          font-weight: bold;
          margin: 0.4em 0;
          line-height: 1.3;
        }
        [contenteditable] h3 {
          font-size: 1.1em;
          font-weight: bold;
          margin: 0.3em 0;
          line-height: 1.3;
        }
        [contenteditable] p {
          margin: 0.5em 0;
          line-height: 1.6;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        [contenteditable] li {
          margin: 0.2em 0;
          line-height: 1.5;
        }
        [contenteditable] blockquote {
          margin: 1em 0;
          padding: 0.75em 1.25em;
          border-left: 4px solid #3B82F6;
          background-color: #F8FAFC;
          font-style: italic;
          color: #475569;
        }
        [contenteditable] table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          border: 1px solid #E2E8F0;
        }
        [contenteditable] table td,
        [contenteditable] table th {
          border: 1px solid #E2E8F0;
          padding: 0.5em;
          text-align: left;
          vertical-align: top;
        }
        [contenteditable] table th {
          background-color: #F1F5F9;
          font-weight: bold;
        }
        [contenteditable] table tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        [contenteditable] hr {
          margin: 1em 0;
          border: none;
          border-top: 2px solid #E2E8F0;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 0.5em 0;
          border-radius: 4px;
        }
        [contenteditable] a {
          color: #3B82F6;
          text-decoration: underline;
        }
        [contenteditable] a:hover {
          color: #1D4ED8;
        }
        [contenteditable] strong {
          font-weight: bold;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
        [contenteditable][style*="text-align: center"] {
          text-align: center;
        }
        [contenteditable][style*="text-align: right"] {
          text-align: right;
        }
        [contenteditable][style*="text-align: left"] {
          text-align: left;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;