import JoinForm from "../islands/JoinForm.tsx";

export default function Home() {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
      <div class="w-full max-w-md p-8 bg-white text-gray-900 rounded-xl shadow-lg">
        <img
          class="mx-auto mb-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="logo"
        />
        <h1 class="text-3xl font-bold text-center mb-4">Join the Radio Room</h1>
        <JoinForm />
      </div>
    </div>
  );
}
