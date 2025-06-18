import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sheetName, entries } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'No entries provided' },
        { status: 400 }
      );
    }

    // Prepare data for Supabase insertion
    const submissionData = entries.map((entry: any) => ({
      user_email: session.user.email,
      channel_title: sheetName,
      video_url: entry.link,
      video_title: entry.title || 'Unknown Title',
      video_format: entry.format,
      submission_month: entry.month,
      published_at: entry.publishedAt || new Date().toISOString(),
    }));

    // Insert into Supabase
    const { data, error } = await supabaseAdmin
      .from('video_submissions')
      .insert(submissionData);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to save submissions to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: `Successfully submitted ${entries.length} video(s)`,
      data
    });

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}