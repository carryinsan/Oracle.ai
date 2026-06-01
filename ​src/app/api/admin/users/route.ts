import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Join users with their ai_usage data for the dashboard
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, tier, email_verified, is_banned, created_at,
        ai_usage ( energy_balance, total_tokens_used )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ status: 'success', data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user_id, action, new_tier } = await req.json();

    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    let updatePayload: any = {};

    switch (action) {
      case 'UPGRADE':
      case 'DOWNGRADE':
        if (!new_tier) return NextResponse.json({ error: 'new_tier required.' }, { status: 400 });
        updatePayload = { tier: new_tier };
        break;
      case 'BAN':
        updatePayload = { is_banned: true };
        break;
      case 'UNBAN':
        updatePayload = { is_banned: false };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', user_id);

    if (error) throw error;

    // Log this action securely in the audit table (Phase 1 triggers handle part of this, but we force manual log here if needed)
    const adminId = req.headers.get('x-user-id');
    await supabaseAdmin.from('audit_logs').insert({
        admin_id: adminId,
        action: `MANUAL_USER_${action}`,
        target_user: user_id,
        metadata: { ...updatePayload }
    }).catch(console.error); // Fire and forget

    return NextResponse.json({ status: 'success', message: `User ${action} applied successfully.` });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


