```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: 'Valid email and password (min 8 chars) are required.' }, 
        { status: 400 }
      );
    }

    // 1. Create User in Supabase Auth
    // Note: The PostgreSQL trigger we wrote in Phase 1 will automatically intercept this 
    // and create the row in public.users, assigning 'free' (or 'elite' for the admin email).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { 
        status: 'success', 
        message: 'Account created successfully. Please verify your email.' 
      }, 
      { status: 201 }
    );

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

```
