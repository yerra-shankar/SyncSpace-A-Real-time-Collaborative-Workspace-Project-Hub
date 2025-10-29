import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Code
} from 'lucide-react';
import '../../styles/App.css';

function EditorToolbar() {
  const toolbarButtons = [
    { id: 'bold', icon: <Bold size={18} />, label: 'Bold' },
    { id: 'italic', icon: <Italic size={18} />, label: 'Italic' },
    { id: 'underline', icon: <Underline size={18} />, label: 'Underline' },
    { id: 'list', icon: <List size={18} />, label: 'Bullet List' },
    { id: 'ordered-list', icon: <ListOrdered size={18} />, label: 'Numbered List' },
    { id: 'link', icon: <Link size={18} />, label: 'Insert Link' },
    { id: 'image', icon: <Image size={18} />, label: 'Insert Image' },
    { id: 'code', icon: <Code size={18} />, label: 'Code Block' },
  ];

  return (
    <div className="editor-toolbar-wrapper">
      <div className="editor-toolbar-buttons-row">
        {toolbarButtons.map((button) => (
          <button
            key={button.id}
            className="editor-toolbar-btn"
            title={button.label}
            aria-label={button.label}
          >
            {button.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EditorToolbar;