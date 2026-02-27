interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
    onClose: () => void;
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
    if (!message) return null;

    return (
        <div className={`toast ${type} ${visible ? '' : 'hidden'}`}>
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}>✕</button>
        </div>
    );
}
