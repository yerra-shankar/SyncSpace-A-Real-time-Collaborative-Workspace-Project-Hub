import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import EditorToolbar from './EditorToolbar';
import RemoteCursor from './RemoteCursor';
import { UserPlus, CheckCircle, Save } from 'lucide-react';
import socketService from '../../socket/socket';
import api from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/App.css';

function DocumentEditor({ workspaceId }) {
  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  const [content, setContent] = useState('');
  const [documentId, setDocumentId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [collaborators, setCollaborators] = useState([
    { id: 1, name: 'You', color: '#667eea', cursor: null },
    { id: 2, name: 'Sarah', color: '#10b981', cursor: null }
  ]);
  const [remoteCursors, setRemoteCursors] = useState([]);
  
  const quillRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    loadDocument();
    subscribeToDocumentUpdates();

    return () => {
      if (documentId) {
        socketService.leaveDocument(documentId);
      }
      socketService.unsubscribeFromDocumentUpdates();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workspaceId]);

  const loadDocument = async () => {
    try {
      // Load existing document or create new one
      const documents = await api.documents.getByWorkspace(workspaceId);
      if (documents.length > 0) {
        const doc = documents[0];
        setDocumentId(doc.id);
        setDocumentTitle(doc.title);
        setContent(doc.content);
        socketService.joinDocument(doc.id);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
    }
  };

  const subscribeToDocumentUpdates = () => {
    socketService.subscribeToDocumentUpdates((data) => {
      if (data.type === 'content') {
        setContent(data.content);
      } else if (data.type === 'cursor') {
        updateRemoteCursor(data);
      }
    });
  };

  const updateRemoteCursor = (data) => {
    setRemoteCursors(prev => {
      const existing = prev.find(c => c.userId === data.userId);
      if (existing) {
        return prev.map(c => 
          c.userId === data.userId ? { ...c, position: data.position } : c
        );
      } else {
        return [...prev, { userId: data.userId, position: data.position, color: data.color }];
      }
    });
  };

  const handleContentChange = (value) => {
    setContent(value);
    
    // Emit changes to other users
    if (documentId) {
      socketService.emitDocumentUpdate(documentId, value, null);
    }

    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(value);
    }, 2000);
  };

  const saveDocument = async (contentToSave = content) => {
    setIsSaving(true);
    try {
      if (documentId) {
        await api.documents.update(documentId, {
          title: documentTitle,
          content: contentToSave
        });
      } else {
        const response = await api.documents.create(workspaceId, {
          title: documentTitle,
          content: contentToSave
        });
        setDocumentId(response.document.id);
        socketService.joinDocument(response.document.id);
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'align',
    'link', 'image'
  ];

  return (
    <div className="document-editor-wrapper">
      <div className="container-fluid h-100">
        <div className="row h-100">
          <div className="col-12">
            <div className="document-editor-container">
              {/* Editor Header */}
              <div className="document-editor-header-section">
                <div className="row align-items-center">
                  <div className="col-12 col-md-6">
                    <input
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="document-title-input-field"
                      placeholder="Untitled Document"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="document-editor-actions-row">
                      {/* Collaborators */}
                      <div className="document-collaborators-list">
                        {collaborators.slice(0, 3).map((user) => (
                          <div
                            key={user.id}
                            className="document-collaborator-avatar"
                            style={{ backgroundColor: user.color }}
                            title={user.name}
                          >
                            {user.name.charAt(0)}
                          </div>
                        ))}
                        {collaborators.length > 3 && (
                          <div className="document-collaborator-avatar document-collaborator-more">
                            +{collaborators.length - 3}
                          </div>
                        )}
                        <button className="document-invite-btn">
                          <UserPlus size={16} />
                        </button>
                      </div>

                      {/* Save Status */}
                      <div className="document-save-status">
                        {isSaving ? (
                          <>
                            <span className="document-save-spinner"></span>
                            <span className="d-none d-sm-inline">Saving...</span>
                          </>
                        ) : lastSaved ? (
                          <>
                            <CheckCircle size={16} className="document-save-icon" />
                            <span className="d-none d-sm-inline">Saved</span>
                          </>
                        ) : null}
                      </div>

                      {/* Manual Save Button */}
                      <button
                        onClick={() => saveDocument()}
                        className="document-save-btn d-none d-md-inline-flex"
                        disabled={isSaving}
                      >
                        <Save size={16} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Content */}
              <div className="document-editor-content-area">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={handleContentChange}
                  modules={modules}
                  formats={formats}
                  placeholder="Start typing your document..."
                  className="document-quill-editor"
                />

                {/* Remote Cursors */}
                {remoteCursors.map((cursor) => (
                  <RemoteCursor
                    key={cursor.userId}
                    position={cursor.position}
                    color={cursor.color}
                    userName={cursor.userName}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentEditor;