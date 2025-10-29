import React, { useState } from 'react';
import {
  FileText,
  Image,
  File,
  Download,
  Eye,
  MoreVertical,
  Trash2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import '../../styles/App.css';

function FileCard({ file, viewMode, onClick, onDownload, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText size={viewMode === 'grid' ? 32 : 24} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image size={viewMode === 'grid' ? 32 : 24} />;
      default:
        return <File size={viewMode === 'grid' ? 32 : 24} />;
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDownload();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete();
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (viewMode === 'list') {
    return (
      <div className="file-card-list-wrapper" onClick={onClick}>
        <div className="container-fluid">
          <div className="row align-items-center g-3">
            <div className="col-auto">
              <div className="file-card-icon-wrapper">
                {getFileIcon(file.type)}
              </div>
            </div>

            <div className="col">
              <h4 className="file-card-name">{file.name}</h4>
              <div className="file-card-meta-row">
                <span className="file-card-meta-item">{file.size}</span>
                <span className="file-card-meta-divider">•</span>
                <span className="file-card-meta-item">{formatDate(file.date)}</span>
                <span className="file-card-meta-divider d-none d-md-inline">•</span>
                <span className="file-card-meta-item d-none d-md-inline">
                  Uploaded by {file.uploader}
                </span>
              </div>
            </div>

            <div className="col-auto">
              <div className="file-card-actions-row">
                <button
                  onClick={handleDownload}
                  className="file-card-action-btn d-none d-sm-inline-flex"
                  aria-label="Download"
                >
                  <Download size={18} />
                </button>
                
                <div className="file-card-menu-wrapper">
                  <button
                    onClick={handleMenuClick}
                    className="file-card-action-btn"
                    aria-label="More options"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {showMenu && (
                    <div className="file-card-dropdown-menu">
                      <button onClick={handleDownload} className="file-card-dropdown-item">
                        <Download size={16} />
                        <span>Download</span>
                      </button>
                      <button onClick={onClick} className="file-card-dropdown-item">
                        <Eye size={16} />
                        <span>View Details</span>
                      </button>
                      <div className="file-card-dropdown-divider"></div>
                      <button onClick={handleDelete} className="file-card-dropdown-item file-card-dropdown-item-danger">
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="file-card-grid-wrapper" onClick={onClick}>
      <div className="file-card-grid-header">
        <div className="file-card-icon-large">
          {getFileIcon(file.type)}
        </div>
        
        <div className="file-card-menu-wrapper">
          <button
            onClick={handleMenuClick}
            className="file-card-menu-btn"
            aria-label="File options"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="file-card-dropdown-menu">
              <button onClick={handleDownload} className="file-card-dropdown-item">
                <Download size={16} />
                <span>Download</span>
              </button>
              <button onClick={onClick} className="file-card-dropdown-item">
                <Eye size={16} />
                <span>View Details</span>
              </button>
              <div className="file-card-dropdown-divider"></div>
              <button onClick={handleDelete} className="file-card-dropdown-item file-card-dropdown-item-danger">
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="file-card-grid-body">
        <h4 className="file-card-name">{file.name}</h4>
        <p className="file-card-meta-text">
          {file.size} • {formatDate(file.date)}
        </p>
      </div>

      <div className="file-card-grid-footer">
        <div className="file-card-uploader-info">
          <div className="file-card-uploader-avatar">
            {file.uploader?.charAt(0) || 'U'}
          </div>
          <span className="file-card-uploader-name d-none d-sm-inline">
            {file.uploader}
          </span>
        </div>

        {file.versions && (
          <div className="file-card-versions-info">
            <Clock size={14} />
            <span>{file.versions} versions</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileCard;