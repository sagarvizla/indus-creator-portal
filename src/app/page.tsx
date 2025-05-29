'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import VideoSelector from '@/components/VideoSelector'; // Assuming this component exists

// Simple SVG Icons for UI elements
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.59L5.84 9.4c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-500 mr-3">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <path d="M12 9v4"></path>
    <path d="M12 17h.01"></path>
  </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-500 mr-3">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

// Simple Spinner Icon
const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default function Home() {
  const { data: session, status } = useSession();
  const [channelInput, setChannelInput] = useState('');
  const [channelId, setChannelId] = useState<string | null>(null);
  const [changeCount, setChangeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'success' | 'info'>('info');

  useEffect(() => {
    const savedId = localStorage.getItem('channelId');
    const count = parseInt(localStorage.getItem('channelChangeCount') || '0');
    if (savedId) setChannelId(savedId);
    setChangeCount(count);
  }, []);

  const showModal = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setModalMessage(message);
    setModalType(type);
    setIsModalOpen(true);
  }, []);

  const extractChannelId = async (input: string): Promise<string | null> => {
    const trimmed = input.trim();
    if (trimmed.startsWith("UC") && trimmed.length === 24) return trimmed;

    const channelMatch = trimmed.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (channelMatch) return channelMatch[1];

    const handleMatch = trimmed.match(/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) {
      const handle = handleMatch[1];
      try {
        if (!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) {
          console.error("YouTube API Key is not configured.");
          showModal("Configuration error: YouTube API Key is missing.", "error");
          return null;
        }
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
        );
        if (!response.ok) {
          console.error("API request failed:", response.status, await response.text());
          showModal(`Error fetching channel ID from handle: API request failed (${response.status}).`, "error");
          return null;
        }
        const data = await response.json();
        if (data?.items?.length > 0) {
          const id = data.items[0].snippet.channelId;
          console.log("Fetched real channelId:", id);
          return id;
        } else {
          showModal("Could not find a channel for the provided handle.", "error");
          return null;
        }
      } catch (err) {
        console.error("Error resolving handle:", err);
        showModal("An error occurred while trying to resolve the channel handle.", "error");
        return null;
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (changeCount >= 2 && !isLoading) { // Check isLoading to prevent re-triggering modal if already loading
      showModal("You’ve already set your channel twice. Further changes are disabled.", "error");
      return;
    }

    setIsLoading(true); // Start loading
    try {
      const id = await extractChannelId(channelInput);
      if (!id) {
        if(!isModalOpen) {
           showModal("Could not resolve channel ID. Please check the link or try again.", "error");
        }
        return;
      }

      setChannelId(id);
      localStorage.setItem('channelId', id);

      const newCount = changeCount + 1;
      localStorage.setItem('channelChangeCount', newCount.toString());
      setChangeCount(newCount);
      showModal("Channel ID saved successfully!", "success");
    } catch (error) {
        // Catch any unexpected errors during the process
        console.error("Unexpected error in handleSave:", error);
        showModal("An unexpected error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  if (status === 'loading') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <p className="text-lg font-medium text-slate-700">Loading your portal...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-500 to-indigo-600 p-6 text-white">
        <div className="bg-white/20 backdrop-blur-lg p-8 rounded-xl shadow-2xl text-center">
          <h1 className="text-4xl font-bold mb-3">Indus Creator Portal</h1>
          <p className="text-lg mb-8 opacity-90">Manage your YouTube channel data with ease.</p>
          <button
            onClick={() => signIn('google')}
            className="flex items-center justify-center bg-white text-sky-600 px-8 py-3 rounded-lg font-semibold hover:bg-sky-50 transition-colors shadow-md hover:shadow-lg"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  if (!channelId) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">
            Welcome, {session.user?.name || 'Creator'}!
          </h2>
          <p className="mb-6 text-slate-600">
            Let's link your YouTube Channel. Enter your Channel ID, full channel link, or your channel handle (e.g., @YourHandle).
          </p>
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            className="border-slate-300 border px-4 py-3 rounded-md w-full mb-4 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
            placeholder="e.g., UCxxxxxxxxxxxx or @YourHandle"
            disabled={isLoading} // Disable input while loading
          />
          <button
            onClick={handleSave}
            disabled={isLoading || changeCount >= 2} // Disable button while loading or if count exceeded
            className="bg-sky-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-sky-700 transition-colors w-full shadow-md hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <SpinnerIcon />
                Processing...
              </>
            ) : (
              'Save Channel ID'
            )}
          </button>
          {isLoading && ( // Simple text loading bar below button
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-3 overflow-hidden">
                <div className="bg-sky-500 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          )}
          <p className="text-xs mt-4 text-slate-500">
            {changeCount < 2
              ? `You can change this ${2 - changeCount} more time(s).`
              : "You cannot change your channel ID further."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">
              Hello, {session.user?.name || 'Creator'}!
            </h1>
            <p className="text-slate-600">Here's your creator dashboard.</p>
          </div>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-red-600 transition-colors shadow hover:shadow-md mt-4 sm:mt-0"
          >
            Sign Out
          </button>
        </header>

        <div className="bg-sky-50 border border-sky-200 text-sky-700 px-4 py-3 rounded-lg mb-8 text-sm flex items-center shadow">
          <CheckCircleIcon />
          <span>
            Successfully linked YouTube Channel ID: <code className="bg-sky-100 px-1 py-0.5 rounded text-xs">{channelId}</code>
          </span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Your Videos</h2>
            <VideoSelector />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex items-start mb-4">
              {modalType === 'error' && <AlertTriangleIcon />}
              {modalType === 'success' && <CheckCircleIcon />}
              <h3 className={`text-lg font-semibold ${
                modalType === 'error' ? 'text-red-700' : 
                modalType === 'success' ? 'text-green-700' : 'text-slate-800'
              }`}>
                {modalType === 'error' ? 'Alert' : modalType === 'success' ? 'Success' : 'Notification'}
              </h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm">{modalMessage}</p>
            <button
              onClick={() => {
                setIsModalOpen(false);
                // If the modal was shown due to loading, and loading is finished,
                // we don't want to re-enable the button here if it should remain disabled (e.g. changeCount >= 2)
              }}
              className="bg-sky-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-sky-700 transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
