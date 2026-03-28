import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, users } from '@tiny-story-world/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName, role } = body;

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const db = getDb();
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        displayName,
        role: role || 'student',
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
      });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    if (
      error?.code === '23505' ||
      error?.message?.includes('unique') ||
      error?.message?.includes('duplicate')
    ) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
