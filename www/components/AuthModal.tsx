import React, { useState } from 'react';

interface AuthModalProps {
    onClose: () => void;
    onAuth: (username: string) => void;
}

function AuthModal({ onClose, onAuth }: AuthModalProps) {
    const [username, setUsername] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = username.trim();
        if (!trimmed) return;
        onAuth(trimmed);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-center">Login / Sign Up</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <div className="flex justify-end space-x-2">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Continue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AuthModal;
