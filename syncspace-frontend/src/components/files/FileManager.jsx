import React, { useState, useEffect } from 'react';
import FileCard from './FileCard';
import { Upload, Search, Filter, Grid, List } from 'lucide-react';
import api from '@services/api';
import { toast } from 'react-toastify';
import '../../styles/App.css';

function FileManager({ workspaceId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadFiles();
  }, [workspaceId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const filesData = await api.files.getByWorkspace(workspaceId);
      setFiles(filesData);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      toast.info('Uploading files...');
      await api.files.upload(workspaceId, formData, (progress) => {
        console.log('Upload progress:', progress);
      });
      toast.success('Files uploaded successfully!');
      loadFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    }
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await api.files.delete(fileId);
      toast.success('File deleted successfully');
      setFiles(files.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleFileDownload = async (file) => {
    try {
      const blob = await api.files.download(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="file-manager-loading-wrapper">
        <div className="file-manager-spinner"></div>
        <p>Loading files...</p>
      </div>
    );
  }

  return (
    <div className="file-manager-wrapper">
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="file-manager-header-section">
              <div className="row align-items-center g-3">
                <div className="col-12 col-md-6">
                  <h2 className="file-manager-title">Files</h2>
                  <p className="file-manager-subtitle">
                    Manage and share files with your team
                  </p>
                </div>
                
                <div className="col-12 col-md-6">
                  <div className="file-manager-actions-row">
                    <label className="file-upload-btn">
                      <Upload size={20} />
                      <span className="d-none d-sm-inline">Upload Files</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="file-upload-input"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="file-manager-toolbar">
              <div className="row align-items-center g-3">
                {/* Search */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="file-search-wrapper">
                    <Search size={18} className="file-search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search files..."
                      className="file-search-input"
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="col-6 col-md-3 col-lg-3">
                  <div className="file-filter-wrapper">
                    <Filter size={18} />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="file-filter-select"
                    >
                      <option value="all">All Types</option>
                      <option value="pdf">PDF</option>
                      <option value="doc">Documents</option>
                      <option value="image">Images</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="col-6 col-md-3 col-lg-5">
                  <div className="file-view-toggle">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`file-view-btn ${viewMode === 'grid' ? 'file-view-btn-active' : ''}`}
                      aria-label="Grid view"
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`file-view-btn ${viewMode === 'list' ? 'file-view-btn-active' : ''}`}
                      aria-label="List view"
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Files Grid/List */}
        <div className="row">
          <div className="col-12">
            {filteredFiles.length === 0 ? (
              <div className="file-manager-empty-state">
                <Upload size={48} />
                <h3>No files found</h3>
                <p>Upload files to get started</p>
                <label className="file-upload-btn">
                  <Upload size={20} />
                  Upload Files
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="file-upload-input"
                  />
                </label>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'row g-3' : 'file-list-view'}>
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={viewMode === 'grid' ? 'col-12 col-sm-6 col-md-4 col-lg-3' : ''}
                  >
                    <FileCard
                      file={file}
                      viewMode={viewMode}
                      onClick={() => handleFileClick(file)}
                      onDownload={() => handleFileDownload(file)}
                      onDelete={() => handleFileDelete(file.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileManager;