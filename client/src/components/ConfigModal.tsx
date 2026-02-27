import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface Settings {
    projectName: string;
    jiraEmail: string;
    jiraApiKey: string;
    jiraUrl: string;
    issueType: string;
    groqApiKey: string;
}

const DEFAULT_SETTINGS: Settings = {
    projectName: '',
    jiraEmail: '',
    jiraApiKey: '',
    jiraUrl: '',
    issueType: 'Bug',
    groqApiKey: '',
};

export default function ConfigModal({ isOpen, onClose, showToast }: ConfigModalProps) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            const response = await fetch(`${API_BASE}/settings`);
            if (response.ok) {
                const data = await response.json();
                setSettings({ ...DEFAULT_SETTINGS, ...data });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`${API_BASE}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            const result = await response.json();
            if (result.success) {
                showToast('✅ Settings saved successfully!', 'success');
                onClose();
            } else {
                showToast(`❌ ${result.message}`, 'error');
            }
        } catch (error: any) {
            showToast(`❌ Failed to save: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        let jiraOk = false;

        // Test Jira
        try {
            const jiraRes = await fetch(`${API_BASE}/test/jira`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jiraEmail: settings.jiraEmail,
                    jiraApiKey: settings.jiraApiKey,
                    jiraUrl: settings.jiraUrl,
                }),
            });
            const jiraResult = await jiraRes.json();
            if (jiraResult.success) {
                jiraOk = true;
                showToast(`✅ Jira: ${jiraResult.message}`, 'success');
            } else {
                showToast(`❌ Jira: ${jiraResult.message}`, 'error');
            }
        } catch (error: any) {
            showToast(`❌ Jira test failed: ${error.message}`, 'error');
        }

        // Test Groq
        try {
            const groqRes = await fetch(`${API_BASE}/test/groq`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groqApiKey: settings.groqApiKey }),
            });
            const groqResult = await groqRes.json();
            if (groqResult.success) {
                // Stagger toast so both Jira and Groq results are visible
                setTimeout(() => {
                    showToast(`✅ Groq: ${groqResult.message}`, 'success');
                }, jiraOk ? 1500 : 0);
            } else {
                setTimeout(() => {
                    showToast(`❌ Groq: ${groqResult.message}`, 'error');
                }, 1500);
            }
        } catch (error: any) {
            setTimeout(() => {
                showToast(`❌ Groq test failed: ${error.message}`, 'error');
            }, 1500);
        }

        setIsTesting(false);
    };

    const updateField = (field: keyof Settings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="config-overlay" onClick={onClose} />
            <div className="config-panel">
                <div className="config-header">
                    <div className="config-header-left">
                        <div className="config-header-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        <h2>Configuration</h2>
                    </div>
                    <button className="config-close" onClick={onClose}>✕</button>
                </div>

                <div className="config-body">
                    <div className="form-group">
                        <label className="form-label">Project Key</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. BUG, PROJ, FE"
                            value={settings.projectName}
                            onChange={(e) => updateField('projectName', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">JIRA Email</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="your-email@company.com"
                            value={settings.jiraEmail}
                            onChange={(e) => updateField('jiraEmail', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">JIRA API Key</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter your Jira API Token"
                            value={settings.jiraApiKey}
                            onChange={(e) => updateField('jiraApiKey', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">JIRA Connection URL</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="bugzz.atlassian.net/"
                            value={settings.jiraUrl}
                            onChange={(e) => updateField('jiraUrl', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Issue Type</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Bug"
                            value={settings.issueType}
                            onChange={(e) => updateField('issueType', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">GROQ API Key</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="gsk_..."
                            value={settings.groqApiKey}
                            onChange={(e) => updateField('groqApiKey', e.target.value)}
                        />
                    </div>
                </div>

                <div className="config-footer">
                    <button
                        className="btn-test"
                        onClick={handleTestConnection}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <>
                                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                                Testing...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                Test Connection
                            </>
                        )}
                    </button>
                    <button
                        className="btn-save"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
