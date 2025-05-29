'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { format as formatDate, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface Video {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  selected: boolean;
  format: 'VIDEO' | 'SHORTS' | 'LIVE';
}

const appMonths = [ // Renamed to avoid conflict if user has 'months' in global scope from their HTML
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// SVG Icons (can be moved to a separate file if used elsewhere)
const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-400 mr-3"> {/* Adjusted color for dark theme */}
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <path d="M12 9v4"></path>
    <path d="M12 17h.01"></path>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-400 mr-3"> {/* Adjusted color */}
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const SpinnerIcon = (props: { className?: string }) => ( // Added className prop
  <svg className={`animate-spin h-5 w-5 text-white ${props.className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-sky-400 mr-3"> {/* Adjusted color */}
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const NoVideosIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckboxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);


export default function VideoSelector() {
  const { data: session, status } = useSession();
  const [channelTitle, setChannelTitle] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [sheetMonth, setSheetMonth] = useState<string>(appMonths[new Date().getMonth()]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'success' | 'info'>('info');
  const [modalTitleText, setModalTitleText] = useState('');


  const channelId = typeof window !== 'undefined' ? localStorage.getItem('channelId') : null;

  const showModal = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info', title?: string) => {
    setModalMessage(message);
    setModalType(type);
    setModalTitleText(title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Information'));
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!channelId) {
        setChannelTitle("No Channel ID Set");
        return;
    }
    axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', id: channelId, key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY }
    })
    .then(res => {
      const title = res.data.items?.[0]?.snippet?.title;
      if (title) setChannelTitle(title);
      else setChannelTitle("Channel Not Found");
    })
    .catch(err => {
        console.error("Failed to fetch channel title:", err);
        setChannelTitle("Error Loading Channel");
        showModal("Could not fetch channel details. Please ensure the Channel ID is correct and API key is valid.", "error");
    });
  }, [channelId, showModal]);

  const fetchVideos = useCallback(async () => {
    if (!channelId) return;
    setLoadingVideos(true);
    setVideos([]);

    const year = new Date().getFullYear();
    const publishedAfter = startOfMonth(new Date(year, selectedMonth)).toISOString();
    const publishedBefore = endOfMonth(new Date(year, selectedMonth)).toISOString();

    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
          part: 'snippet', channelId, maxResults: 50,
          order: 'date', type: 'video', publishedAfter, publishedBefore,
        }
      });
      setVideos(
        res.data.items.map((item: any) => ({
          id: item.id.videoId,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`, // Standard YouTube watch URL
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url, // Better thumbnail fallback
          publishedAt: item.snippet.publishedAt,
          selected: false,
          format: 'VIDEO' as const,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      showModal('Failed to fetch videos. Please check your API key and network connection.', 'error');
      setVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  }, [channelId, selectedMonth, showModal]);

  useEffect(() => {
    setSheetMonth(appMonths[selectedMonth]);
    if (channelId) { // Only fetch if channelId is present
        fetchVideos();
    }
  }, [selectedMonth, fetchVideos, channelId]);


  function toggleSelection(videoId: string) {
    setVideos(v => v.map(video => video.id === videoId ? { ...video, selected: !video.selected } : video));
  }

  function changeFormat(videoId: string, fmt: Video['format']) {
    setVideos(v => v.map(video => video.id === videoId ? { ...video, format: fmt } : video));
  }

  async function handleSubmit() {
    if (!channelTitle || channelTitle === "Loading channel..." || channelTitle === "Error Loading Channel" || channelTitle === "No Channel ID Set" || channelTitle === "Channel Not Found") {
      showModal('Channel information is not correctly loaded. Please verify your Channel ID setup.', 'info');
      return;
    }
    const selected = videos.filter(v => v.selected);
    if (selected.length === 0) {
      showModal('Please select at least one video to submit.', 'info');
      return;
    }

    setIsSubmitting(true);
    const entries = selected.map(v => ({
      link: v.url,
      format: v.format,
      month: sheetMonth,
    }));

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: channelTitle, entries })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        showModal(`Successfully submitted ${selected.length} video(s) to the "${channelTitle}" sheet!`, 'success');
        setVideos(currentVideos => currentVideos.map(v => ({ ...v, selected: false })));
      } else {
        throw new Error(data.message || 'Submission failed due to an unknown server error.');
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      showModal(`Submission failed: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === 'loading') return <div className="flex justify-center items-center min-h-screen bg-dark-theme"><SpinnerIcon className="text-sky-400 h-10 w-10"/> <p className="ml-3 text-xl text-gray-300">Initializing session...</p></div>;
  if (!session) return (
    <div className="flex justify-center items-center min-h-screen bg-dark-theme">
      <p className="text-xl text-gray-300">Please sign in to access the video selector.</p>
    </div>
  );
   // No Channel ID message is handled by the main page.tsx, but we can add a fallback.
  if (!channelId && status === 'authenticated') return (
    <div className="bg-dark-theme text-center py-10 min-h-[calc(100vh-200px)] flex flex-col justify-center items-center">
        <InfoIcon />
        <p className="text-xl font-semibold text-amber-400 mt-2">Channel ID Not Set</p>
        <p className="text-gray-400 text-md mt-1">Please set your YouTube Channel ID on the main portal page first.</p>
    </div>
  );


  return (
    <div className="bg-dark-theme min-h-screen text-white py-8"> {/* Main dark theme container */}
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-1 channel-header">{channelTitle || 'Loading channel...'}</h1>
            <p className="text-gray-400 text-sm sm:text-base">Select videos to include in your monthly report for <strong className="text-sky-400">{sheetMonth}</strong></p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || videos.filter(v => v.selected).length === 0 || loadingVideos}
              className="btn bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center min-w-[200px] text-base shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <SpinnerIcon className="-ml-1 mr-2" />
                  Submitting...
                </>
              ) : (
                `Submit ${videos.filter(v => v.selected).length > 0 ? videos.filter(v => v.selected).length : ''} Selection`
              )}
            </button>
          </div>
        </div>

        {/* Month Selector */}
        <div className="month-selector mb-10 p-1">
          <div className="flex overflow-x-auto hide-scrollbar">
            {appMonths.map((month, index) => (
              <div
                key={month}
                className={`month-item px-5 py-3 text-sm sm:text-base whitespace-nowrap ${index === selectedMonth ? 'active' : ''}`}
                onClick={() => !loadingVideos && setSelectedMonth(index)} // Prevent change while loading
              >
                {month}
              </div>
            ))}
          </div>
        </div>

        {/* Loading State Skeletons */}
        {loadingVideos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => ( // Show 8 skeletons or less based on typical load
              <div key={i} className="shimmer h-72 rounded-xl"></div>
            ))}
          </div>
        )}

        {/* No Videos Message */}
        {!loadingVideos && videos.length === 0 && (
          <div className="bg-gray-800 bg-opacity-60 rounded-xl p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
            <NoVideosIcon />
            <h3 className="text-xl font-medium mb-2 text-gray-200">No videos found for {appMonths[selectedMonth]}</h3>
            <p className="text-gray-400">Try selecting a different month or check your YouTube channel.</p>
          </div>
        )}

        {/* Videos Grid */}
        {!loadingVideos && videos.length > 0 && (
          <div className="video-grid"> {/* Animation applied via globals.css */}
            {videos.map((video, index) => {
              const badgeClass = video.format === 'VIDEO' ? 'badge-video' : video.format === 'SHORTS' ? 'badge-shorts' : 'badge-live';
              return (
                <div
                  key={video.id}
                  className={`video-card rounded-xl bg-gray-800 bg-opacity-50 overflow-hidden relative cursor-pointer ${video.selected ? 'selected' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => toggleSelection(video.id)} // Click anywhere on card to toggle
                >
                  <div className={`badge ${badgeClass}`}>{video.format}</div>
                  <div className="checkbox-container">
                    <CheckboxIcon />
                  </div>
                  <div className="thumbnail-container">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                  </div>
                  <div className="p-4">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                      className="font-semibold text-base mb-2 line-clamp-2 text-gray-100 hover:text-sky-400 transition-colors"
                      title={video.title}
                    >
                      {video.title}
                    </a>
                    <p className="text-gray-400 text-xs mb-3">
                      Published: {formatDate(parseISO(video.publishedAt), 'MMM d, yyyy')}
                    </p>
                    {/* Format selector directly on card, only if selected for clarity or always visible */}
                     <div className="mt-2">
                        <label htmlFor={`format-${video.id}`} className="sr-only">Format:</label> {/* Screen reader only label */}
                        <select
                        id={`format-${video.id}`}
                        value={video.format}
                        onClick={(e) => e.stopPropagation()} // Prevent card click
                        onChange={e => {
                            e.stopPropagation(); // Prevent card click
                            changeFormat(video.id, e.target.value as Video['format']);
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-200 px-2 py-1.5 text-xs rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition w-full"
                        >
                        <option value="VIDEO">VIDEO</option>
                        <option value="SHORTS">SHORTS</option>
                        <option value="LIVE">LIVE</option>
                        </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Notifications */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] modal"> {/* Increased z-index */}
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 modal-content shadow-2xl">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                {modalType === 'error' && <AlertTriangleIcon />}
                {modalType === 'success' && <CheckCircleIcon />}
                {modalType === 'info' && <InfoIcon />}
              </div>
              <div className="ml-3">
                <h3 className={`text-lg font-semibold ${
                  modalType === 'error' ? 'text-red-400' : 
                  modalType === 'success' ? 'text-green-400' : 'text-sky-400'
                }`}>
                  {modalTitleText}
                </h3>
                <p className="text-sm text-gray-300 mt-1">{modalMessage}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`btn px-5 py-2 rounded-lg font-medium text-sm text-white transition-colors ${
                  modalType === 'error' ? 'bg-red-500 hover:bg-red-600' : 
                  modalType === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-sky-500 hover:bg-sky-600'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
