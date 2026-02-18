'use server'

import { db } from '@/src/lib/db';
import { users } from '@/src/lib/schema';
import { createSession, deleteSession } from '@/src/lib/session';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function signup(prevState: any, formData: FormData) {

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!firstName || !lastName || !email || !password) {
    return { error: 'All fields are required' };
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length > 0) {
    return { error: 'User already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [newUser] = await db.insert(users).values({

    firstName,  
    lastName,   
    email,
    password: hashedPassword,

  }).returning();

  await createSession(newUser.id.toString());

  redirect('/');
}

export async function signin(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // 1. Find the user
  const [user] = await db.select().from(users).where(eq(users.email, email));

  // 2. Check if user exists and password is correct
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid credentials' };
  }

  //   3. Create session
  await createSession(user.id.toString());

  // 4. Redirect
  redirect('/login');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}