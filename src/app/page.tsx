'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import VideoSelector from '@/components/VideoSelector';

export default function Home() {
  const { data: session, status } = useSession();
  const [channelInput, setChannelInput] = useState('');
  const [channelId, setChannelId] = useState<string | null>(null);
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    const savedId = localStorage.getItem('channelId');
    const count = parseInt(localStorage.getItem('channelChangeCount') || '0');
    if (savedId) setChannelId(savedId);
    setChangeCount(count);
  }, []);

  const extractChannelId = async (input: string): Promise<string | null> => {
    const trimmed = input.trim();

    // ✅ Full UC ID (raw)
    if (trimmed.startsWith("UC") && trimmed.length === 24) return trimmed;

    // ✅ Full channel link
    const channelMatch = trimmed.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (channelMatch) return channelMatch[1];

    // ✅ Handle link (e.g. @VizlaGaming or https://youtube.com/@VizlaGaming)
    const handleMatch = trimmed.match(/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) {
      const handle = handleMatch[1];
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        if (data?.items?.length > 0) {
          const id = data.items[0].snippet.channelId;
          console.log("✅ Fetched real channelId:", id);
          return id;
        }
      } catch (err) {
        console.error("❌ Error resolving handle:", err);
      }
    }

    return null;
  };

  const handleSave = async () => {
    if (changeCount >= 2) {
      alert("❌ You’ve already set your channel twice. Further changes are disabled.");
      return;
    }

    const id = await extractChannelId(channelInput);
    if (!id) {
      alert("❌ Could not resolve channel ID. Please check the link or try again.");
      return;
    }

    setChannelId(id);
    localStorage.setItem('channelId', id);

    const newCount = changeCount + 1;
    localStorage.setItem('channelChangeCount', newCount.toString());
    setChangeCount(newCount);
  };

  if (status === 'loading') return <p className="text-center mt-10">Loading...</p>;

  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-semibold mb-4">Indus Creator Portal</h1>
        <button
          onClick={() => signIn('google')}
          className="bg-blue-600 text-white px-6 py-3 rounded-md"
        >
          Sign in with Google
        </button>
      </main>
    );
  }

  if (!channelId) {
    return (
      <main className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold mb-4">Welcome, {session.user?.name}</h2>
        <p className="mb-2 text-gray-600">Enter your YouTube Channel ID or Link:</p>
        <input
          type="text"
          value={channelInput}
          onChange={(e) => setChannelInput(e.target.value)}
          className="border px-4 py-2 rounded-md w-80 mb-4"
          placeholder="e.g. https://youtube.com/@VizlaGaming"
        />
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition"
        >
          Save Channel ID
        </button>
        <p className="text-xs mt-2 text-gray-500">
          You can only change this twice. We'll use it to fetch your videos.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-xl font-semibold mb-6">Hello, {session.user?.name}!</h1>
      <p className="mb-4">✅ You’ve linked channel ID: <code>{channelId}</code></p>
      <VideoSelector />
      <div className="mt-10">
        <button
          onClick={() => signOut()}
          className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
