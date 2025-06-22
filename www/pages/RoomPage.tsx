import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout.tsx';

function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>();
    const [userInfo, setUserInfo] = useState<{ username: string } | null>(null);

    useEffect(() => {
        // Get user info from localStorage
        const data = localStorage.getItem('syncwatch-user');
        if (data) {
            const userData = JSON.parse(data);
            setUserInfo({ username: userData.username });
        }
    }, []);

    return (
        <Layout title={`Room ${roomId}`}>
            <main className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-bold mb-4">Room {roomId}</h1>
                {userInfo && <p className="text-gray-600">You are {userInfo.username}</p>}
                <div className="mt-8 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
                    <p className="text-yellow-800">
                        Room functionality will be implemented in the next phase. For now, this
                        shows you've successfully joined room {roomId}.
                    </p>
                </div>
            </main>
        </Layout>
    );
}

export default RoomPage;
