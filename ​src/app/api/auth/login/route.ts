import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/db/supabase';
import { signToken } from '@/lib/security/jwt';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
    }

    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // 2. Fetch the user's custom tier and state from our public.users table using Admin Client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('tier, email_verified, is_banned')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    if (userData.is_banned) {
      return NextResponse.json({ error: 'Access denied. Account suspended.' }, { status: 403 });
    }

    // 3. Mint the Cryptographic JWT with the user's tier
    const token = await signToken({
      id: authData.user.id,
      email: authData.user.email!,
      tier: userData.tier,
    });

    // 4. Return token (Frontend should store this securely and pass via Bearer header or cookie)
    return NextResponse.json({
      status: 'success',
      data: {
        access_token: token,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          tier: userData.tier,
          email_verified: userData.email_verified
        }
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


