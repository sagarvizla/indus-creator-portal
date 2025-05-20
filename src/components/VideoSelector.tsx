'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { format as formatDate, startOfMonth, endOfMonth } from 'date-fns';

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
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// (Your Apps Script Web App URL is now behind the Next.js API /api/submit)
export default function VideoSelector() {
  const { data: session, status } = useSession();
  const [channelTitle, setChannelTitle]     = useState<string>('');
  const [selectedMonth, setSelectedMonth]   = useState<number>(new Date().getMonth());
  const [sheetMonth, setSheetMonth]         = useState<string>(months[new Date().getMonth()]);
  const [videos, setVideos]                 = useState<Video[]>([]);
  const [loading, setLoading]               = useState<boolean>(false);

  // Channel ID you saved earlier
  const channelId = typeof window !== 'undefined'
    ? localStorage.getItem('channelId')
    : null;

  // 1️⃣ Fetch channel title once we have the ID
  useEffect(() => {
    if (!channelId) return;
    axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet',
        id: channelId,
        key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
      }
    })
    .then(res => {
      const title = res.data.items?.[0]?.snippet?.title;
      if (title) setChannelTitle(title);
    })
    .catch(console.error);
  }, [channelId]);

  // 2️⃣ Fetch videos whenever month changes
  useEffect(() => {
    setSheetMonth(months[selectedMonth]);
    fetchVideos();
  }, [selectedMonth]);

  async function fetchVideos() {
    if (!channelId) return;
    setLoading(true);

    const year = new Date().getFullYear();
    const publishedAfter  = startOfMonth(new Date(year, selectedMonth)).toISOString();
    const publishedBefore = endOfMonth(new Date(year, selectedMonth)).toISOString();

    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
          part: 'snippet',
          channelId,
          maxResults: 25,
          order: 'date',
          type: 'video',
          publishedAfter,
          publishedBefore,
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
    } catch {
      console.error('Failed to fetch videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelection(videoId: string) {
    setVideos(v =>
      v.map(video =>
        video.id === videoId
          ? { ...video, selected: !video.selected }
          : video
      )
    );
  }

  function changeFormat(videoId: string, fmt: Video['format']) {
    setVideos(v =>
      v.map(video =>
        video.id === videoId ? { ...video, format: fmt } : video
      )
    );
  }

  // 3️⃣ Submit to your Next.js proxy at /api/submit
  async function handleSubmit() {
    if (!channelTitle) {
      alert('❌ Still loading channel info—please wait a moment.');
      return;
    }
    const selected = videos.filter(v => v.selected);
    if (selected.length === 0) {
      alert('❌ Please select at least one video.');
      return;
    }
    const entries = selected.map(v => ({
      link:   v.url,
      format: v.format,
      month:  sheetMonth,
    }));

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: channelTitle, entries })
      });
      const data = await res.json();

      if (data.status === 'success') {
        alert(`✅ Videos submitted to "${channelTitle}" sheet!`);
        setVideos(videos.map(v => ({ ...v, selected: false })));
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (err: any) {
      console.error(err);
      alert('❌ Submission failed: ' + err.message);
    }
  }

  // 4️⃣ Render UI
  if (status === 'loading') return <p>Loading…</p>;
  if (!session) return <p className="text-center mt-10">Sign in first.</p>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="mb-4 font-semibold">Hello, {session.user?.name}!</h2>
      <p className="mb-4 text-sm text-gray-600">
        Submitting into sheet tab: <strong>{channelTitle || '…loading'}</strong>
      </p>

      {/* Month Selector */}
      <div className="mb-6">
        <label className="mr-2 font-medium">Fetch Month:</label>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(+e.target.value)}
          className="border px-3 py-1 rounded"
        >
          {months.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
      </div>

      {/* Video Grid */}
      {loading ? (
        <p>Loading videos…</p>
      ) : videos.length === 0 ? (
        <p>No videos found for {months[selectedMonth]}.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {videos.map(video => (
            <div
              key={video.id}
              className="border rounded-lg p-4 flex flex-col"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-32 h-20 mb-2 rounded"
              />
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 underline mb-1"
              >
                {video.title}
              </a>
              <p className="text-xs text-gray-500 mb-2">
                Uploaded: {formatDate(new Date(video.publishedAt), 'PP')}
              </p>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={video.selected}
                  onChange={() => toggleSelection(video.id)}
                />
                <span>Select</span>
              </label>

              {video.selected && (
                <div className="mt-2">
                  <label className="mr-2 text-sm">Format:</label>
                  <select
                    value={video.format}
                    onChange={e => changeFormat(
                      video.id,
                      e.target.value as Video['format']
                    )}
                    className="border px-2 py-1 text-sm rounded"
                  >
                    <option value="VIDEO">VIDEO</option>
                    <option value="SHORTS">SHORTS</option>
                    <option value="LIVE">LIVE</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Submit Selected Videos
        </button>
      </div>
    </div>
  );
}
