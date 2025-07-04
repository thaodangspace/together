import JoinForm from "../islands/JoinForm.tsx";

export default function Home() {
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center gap-4">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="logo"
        />
        <h1 class="text-4xl font-bold">Join the Radio Room</h1>
        <JoinForm />
      </div>
    </div>
  );
}
