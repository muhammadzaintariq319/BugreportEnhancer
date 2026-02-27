import { useState } from 'react';
import FileDropZone from './components/FileDropZone';
import NotesArea from './components/NotesArea';
import ConfigModal from './components/ConfigModal';
import Toast from './components/Toast';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      showToast('Please upload at least one file before analyzing.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('notes', notes);

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showToast(`✅ ${result.message} — ${result.issueUrl}`, 'success');
        setFiles([]);
        setNotes('');
      } else {
        showToast(`❌ ${result.message}`, 'error');
      }
    } catch (error: any) {
      showToast(`❌ Network error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="app-card">
        {/* Header */}
        <div className="app-header">
          <div className="header-left">
            <div className="header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4A7CFF" strokeWidth="2" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="#4A7CFF" strokeWidth="2" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#4A7CFF" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="header-title">Bug report Enhancer</h1>
          </div>
          <button
            className="settings-btn"
            onClick={() => setIsConfigOpen(true)}
            title="Configuration"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        <div className="divider"></div>

        {/* File Drop Zone */}
        <div className="section">
          <label className="section-label">Attachments (Screenshots, Videos)</label>
          <FileDropZone files={files} onFilesChange={setFiles} />
        </div>

        {/* Notes */}
        <div className="section">
          <label className="section-label">Additional Notes & Context</label>
          <NotesArea value={notes} onChange={setNotes} />
        </div>

        {/* Submit Button */}
        <button
          className={`analyze-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Analyze and push to jira
            </>
          )}
        </button>

        <p className="submit-hint">
          AI will analyze your attachments and notes to generate a comprehensive Jira ticket.
        </p>
      </div>

      {/* Config Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        showToast={showToast}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}

export default App;
