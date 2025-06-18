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

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// SVG Icons
const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-500 mr-3">
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

const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-sky-500 mr-3">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export default function VideoSelector() {
  const { data: session, status } = useSession();
  const [channelTitle, setChannelTitle] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [sheetMonth, setSheetMonth] = useState<string>(months[new Date().getMonth()]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'success' | 'info'>('info');

  const channelId = typeof window !== 'undefined' ? localStorage.getItem('channelId') : null;

  const showModal = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setModalMessage(message);
    setModalType(type);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!channelId) return;
    axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', id: channelId, key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY }
    })
    .then(res => {
      const title = res.data.items?.[0]?.snippet?.title;
      if (title) setChannelTitle(title);
    })
    .catch(err => {
        console.error("Failed to fetch channel title:", err);
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
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
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
    setSheetMonth(months[selectedMonth]);
    fetchVideos();
  }, [selectedMonth, fetchVideos]);

  function toggleSelection(videoId: string) {
    setVideos(v => v.map(video => video.id === videoId ? { ...video, selected: !video.selected } : video));
  }

  function changeFormat(videoId: string, fmt: Video['format']) {
    setVideos(v => v.map(video => video.id === videoId ? { ...video, format: fmt } : video));
  }

  async function handleSubmit() {
    if (!channelTitle) {
      showModal('Still loading channel information. Please wait a moment before submitting.', 'info');
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
      title: v.title,
      format: v.format,
      month: sheetMonth,
      publishedAt: v.publishedAt,
    }));

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: channelTitle, entries })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        showModal(`Successfully submitted ${selected.length} video(s) to your Supabase database!`, 'success');
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

  if (status === 'loading') return <p className="text-center py-10 text-slate-600">Initializing session...</p>;
  if (!session) return (
    <div className="text-center py-10">
      <p className="text-slate-700 font-semibold">Please sign in to access the video selector.</p>
    </div>
  );
  if (!channelId) return (
    <div className="text-center py-10 bg-amber-50 p-6 rounded-lg shadow">
        <InfoIcon />
        <p className="text-amber-700 font-semibold">Channel ID not set.</p>
        <p className="text-amber-600 text-sm">Please set your YouTube Channel ID on the main page first.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Month Selector and Info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-2 sm:mb-0">
                Select Videos for <span className="text-sky-600">{months[selectedMonth]}</span>
            </h3>
            <div className="flex items-center space-x-3">
                <label htmlFor="month-select" className="text-sm font-medium text-slate-600">Change Month:</label>
                <select
                    id="month-select"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(+e.target.value)}
                    className="border-slate-300 border px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                >
                    {months.map((m, i) => ( <option key={i} value={i}>{m}</option>))}
                </select>
            </div>
        </div>
        <p className="text-sm text-slate-500">
          Submitting to Supabase database for channel: <strong className="text-slate-700">{channelTitle || 'Loading channel name...'}</strong>
        </p>
      </div>

      {/* Video Grid Section */}
      {loadingVideos ? (
        <div className="text-center py-10">
          <SpinnerIcon />
          <p className="text-slate-600 mt-2">Loading videos for {months[selectedMonth]}...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-10 bg-white p-6 rounded-lg shadow">
            <InfoIcon/>
          <p className="text-slate-700 font-semibold">No videos found for {months[selectedMonth]}.</p>
          <p className="text-slate-500 text-sm">Try selecting a different month or check your YouTube channel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div
              key={video.id}
              className={`bg-white border rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${video.selected ? 'ring-2 ring-sky-500 border-sky-500' : 'border-slate-200 hover:shadow-xl'}`}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4 space-y-3">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sky-700 hover:text-sky-800 line-clamp-2"
                  title={video.title}
                >
                  {video.title}
                </a>
                <p className="text-xs text-slate-500">
                  Uploaded: {formatDate(parseISO(video.publishedAt), 'MMM d, yyyy')}
                </p>

                <label className="flex items-center space-x-2 cursor-pointer p-2 -ml-2 hover:bg-slate-50 rounded-md">
                  <input
                    type="checkbox"
                    checked={video.selected}
                    onChange={() => toggleSelection(video.id)}
                    className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700">Select Video</span>
                </label>

                {video.selected && (
                  <div className="mt-2 pt-3 border-t border-slate-100">
                    <label htmlFor={`format-${video.id}`} className="mr-2 text-sm font-medium text-slate-600">Format:</label>
                    <select
                      id={`format-${video.id}`}
                      value={video.format}
                      onChange={e => changeFormat(video.id, e.target.value as Video['format'])}
                      className="border-slate-300 border px-2 py-1.5 text-sm rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition w-full"
                    >
                      <option value="VIDEO">VIDEO</option>
                      <option value="SHORTS">SHORTS</option>
                      <option value="LIVE">LIVE</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Button Section */}
      {videos.length > 0 && (
        <div className="mt-10 pt-6 border-t border-slate-200 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || videos.filter(v => v.selected).length === 0}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center text-base"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon />
                Submitting...
              </>
            ) : (
              `Submit ${videos.filter(v => v.selected).length} Selected Video(s)`
            )}
          </button>
        </div>
      )}

      {/* Modal for Notifications */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-start mb-4">
              {modalType === 'error' && <AlertTriangleIcon />}
              {modalType === 'success' && <CheckCircleIcon />}
              {modalType === 'info' && <InfoIcon />}
              <h3 className={`text-xl font-semibold ml-1 ${
                modalType === 'error' ? 'text-red-600' : 
                modalType === 'success' ? 'text-green-600' : 'text-sky-600'
              }`}>
                {modalType === 'error' ? 'Alert' : modalType === 'success' ? 'Success!' : 'Information'}
              </h3>
            </div>
            <p className="text-slate-600 mb-6">{modalMessage}</p>
            <button
              onClick={() => setIsModalOpen(false)}
              className={`w-full px-5 py-2.5 rounded-lg font-semibold text-white transition-colors ${
                modalType === 'error' ? 'bg-red-500 hover:bg-red-600' : 
                modalType === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-sky-500 hover:bg-sky-600'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}