import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, bookPages } from '@tiny-story-world/db';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'book-images';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * POST /api/books/upload-image
 * FormData: file (image), bookId, pageNumber
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase storage not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local' },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const bookId = formData.get('bookId') as string | null;
  const pageNumber = formData.get('pageNumber') as string | null;

  if (!file || !bookId || !pageNumber) {
    return NextResponse.json({ error: 'file, bookId, and pageNumber are required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `File type must be one of: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${bookId}/page-${pageNumber}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    return NextResponse.json({ error: 'Upload failed', message: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Update the bookPages row
  const db = getDb();
  await db
    .update(bookPages)
    .set({ illustrationUrl: publicUrl })
    .where(
      and(
        eq(bookPages.bookId, bookId),
        eq(bookPages.pageNumber, parseInt(pageNumber, 10))
      )
    );

  return NextResponse.json({ url: publicUrl });
}
