import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.tsx';
import { roomAPI } from '../services/api.ts';

function HomePage() {
    const navigate = useNavigate();
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        async function checkUser() {
            const res = await roomAPI.getCurrentUser();
            if (res.success && res.data) {
                const { userId, roomId, username } = res.data;
                localStorage.setItem(
                    'syncwatch-user',
                    JSON.stringify({ roomId, userId, username })
                );
                navigate(`/room/${roomId}`);
            }
        }
        checkUser();
    }, []);

    const handleJoinRoom = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsJoining(true);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;

        try {
            const res = await roomAPI.joinRoom(username);
            if (res.success && res.data) {
                const { userId, room } = res.data;
                localStorage.setItem(
                    'syncwatch-user',
                    JSON.stringify({ roomId: room.id, userId, username })
                );
                navigate(`/room/${room.id}`);
            } else {
                alert(res.error || 'Failed to join room');
            }
        } catch (err) {
            console.error('Join room error', err);
            alert('Failed to join room');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <Layout title="SyncWatch - Watch Together">
            <main className="min-h-screen flex items-center justify-center py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                            <span className="text-blue-600">Sync</span>Watch
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Watch YouTube videos together with friends in real-time
                        </p>
                    </div>

                    <div className="max-w-sm mx-auto">
                        <div className="card">
                            <div className="mb-4">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                    Join the Room
                                </h2>
                                <p className="text-gray-600">Enter your name to join the current room</p>
                            </div>

                            <form onSubmit={handleJoinRoom} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="username"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        placeholder="Enter your name"
                                        className="input-field"
                                        required
                                        disabled={isJoining}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary w-full"
                                    disabled={isJoining}
                                >
                                    {isJoining ? 'Joining...' : 'Enter Room'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="mt-16">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-8">Features</h3>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a1 1 0 001 1h4M9 10V9a1 1 0 011-1h4a1 1 0 011 1v1M9 15v1a1 1 0 001 1h4a1 1 0 001-1v-1"
                                        ></path>
                                    </svg>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Real-time Sync</h4>
                                <p className="text-gray-600">
                                    Watch videos in perfect sync with your friends
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        ></path>
                                    </svg>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Live Chat</h4>
                                <p className="text-gray-600">
                                    Chat with friends while watching videos
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                        ></path>
                                    </svg>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Video Queue</h4>
                                <p className="text-gray-600">
                                    Create playlists and manage what to watch next
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </Layout>
    );
}

export default HomePage;
