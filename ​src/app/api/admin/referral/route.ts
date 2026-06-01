import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { randomBytes } from 'crypto';

function generateSecureCode(tier: string) {
  const randomStr = randomBytes(4).toString('hex').toUpperCase();
  return `ORACLE-${tier.toUpperCase()}-${randomStr}`;
}

export async function POST(req: Request) {
  try {
    const adminId = req.headers.get('x-user-id');
    const { target_tier, duration_days, assigned_email, max_uses = 1 } = await req.json();

    if (!target_tier) {
      return NextResponse.json({ error: 'Target tier is required.' }, { status: 400 });
    }

    const code = generateSecureCode(target_tier);
    
    // Calculate expiration based on provided duration or default to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (duration_days || 7));

    let assignedUserId = null;
    if (assigned_email) {
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', assigned_email)
            .single();
        if (userData) assignedUserId = userData.id;
    }

    const { data, error } = await supabaseAdmin
      .from('referral_codes')
      .insert({
        code,
        target_tier,
        max_uses,
        expires_at: expiresAt.toISOString(),
        created_by: adminId,
        assigned_user_id: assignedUserId
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ status: 'success', data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ status: 'success', data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

