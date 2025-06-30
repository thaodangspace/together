import JoinModal from "../islands/JoinModal.tsx";
import VideoPlayer from "../islands/VideoPlayer.tsx";
import Queue from "../islands/Queue.tsx";
import Chat from "../islands/Chat.tsx";
import UserList from "../islands/UserList.tsx";

export default function Home() {
  return (
    <div class="min-h-screen bg-gray-900 text-white">
      <JoinModal />
      <div class="flex h-screen">
        <div class="flex-1 flex flex-col">
          <VideoPlayer />
          <div class="p-4 border-t border-gray-700">
            <Queue />
          </div>
        </div>
        <div class="w-80 bg-gray-800 flex flex-col">
          <div class="p-4 border-b border-gray-700">
            <UserList />
          </div>
          <div class="flex-1">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
}
