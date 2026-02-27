interface NotesAreaProps {
    value: string;
    onChange: (value: string) => void;
}

export default function NotesArea({ value, onChange }: NotesAreaProps) {
    return (
        <textarea
            className="notes-textarea"
            placeholder="Describe the bug, steps to reproduce, expected vs actual behavior..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}
