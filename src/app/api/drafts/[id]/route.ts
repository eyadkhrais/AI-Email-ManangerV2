import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { subject, body_text, body_html } = body;

    // Validate the request body
    if (!subject || !body_text) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      );
    }

    // Update the draft in the database
    const { data, error } = await supabase
      .from('drafts')
      .update({
        subject,
        body_text,
        body_html: body_html || `<p>${body_text.replace(/\n/g, '<br>')}</p>`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure the draft belongs to the user
      .select()
      .single();

    if (error) {
      console.error('Error updating draft:', error);
      return NextResponse.json(
        { error: 'Failed to update draft' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/drafts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 