import React from 'react';
import { X, Download, Clock, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import '../../styles/App.css';

function FileDetailsModal({ file, onClose, onDownload }) {
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy at h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const formatFileSize = (size) => {
    if (!size) return 'Unknown size';
    // If size is already formatted (e.g., "2.4 MB"), return as is
    if (typeof size === 'string') return size;
    
    const bytes = parseInt(size);
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay-wrapper" onClick={onClose}>
      <div className="modal-content-container modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="container-fluid">
          {/* Modal Header */}
          <div className="row">
            <div className="col-12">
              <div className="modal-header-section">
                <div className="modal-header-icon">
                  <FileText size={24} />
                </div>
                <h3 className="modal-header-title">{file.name}</h3>
                <button onClick={onClose} className="modal-close-btn" aria-label="Close">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="row">
            <div className="col-12">
              <div className="modal-body-section">
                <div className="row g-4">
                  {/* File Preview */}
                  <div className="col-12">
                    <div className="file-details-preview">
                      <FileText size={64} className="file-details-preview-icon" />
                      <p className="file-details-preview-text">Preview not available</p>
                    </div>
                  </div>

                  {/* File Information */}
                  <div className="col-12">
                    <h4 className="file-details-section-title">File Information</h4>
                    
                    <div className="file-details-info-grid">
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <div className="file-details-info-item">
                            <span className="file-details-info-label">Size:</span>
                            <span className="file-details-info-value">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="file-details-info-item">
                            <span className="file-details-info-label">Type:</span>
                            <span className="file-details-info-value">{file.type || 'Unknown'}</span>
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="file-details-info-item">
                            <span className="file-details-info-label">Uploaded by:</span>
                            <span className="file-details-info-value">{file.uploader}</span>
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="file-details-info-item">
                            <span className="file-details-info-label">Date:</span>
                            <span className="file-details-info-value">
                              {formatDate(file.date)}
                            </span>
                          </div>
                        </div>

                        {file.versions && (
                          <div className="col-12">
                            <div className="file-details-info-item">
                              <span className="file-details-info-label">Versions:</span>
                              <span className="file-details-info-value">{file.versions}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-12">
                    <div className="file-details-actions">
                      <div className="row g-2">
                        <div className="col-12 col-sm-6">
                          <button
                            onClick={() => onDownload(file)}
                            className="file-details-action-btn file-details-action-btn-primary"
                          >
                            <Download size={18} />
                            <span>Download</span>
                          </button>
                        </div>
                        <div className="col-12 col-sm-6">
                          <button className="file-details-action-btn file-details-action-btn-secondary">
                            <Clock size={18} />
                            <span>View History</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="row">
            <div className="col-12">
              <div className="modal-footer-section">
                <button
                  type="button"
                  onClick={onClose}
                  className="modal-btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileDetailsModal;