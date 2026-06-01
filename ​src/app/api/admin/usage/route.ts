import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: Request) {
  try {
    // 1. Fetch aggregate metrics
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: dailyActiveUsers } = await supabaseAdmin
      .from('chats')
      .select('user_id', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: usageData } = await supabaseAdmin
      .from('ai_usage')
      .select('total_tokens_used, oracle_uses_today, tavily_searches_today');

    let totalTokens = 0;
    let oracleUses = 0;
    let tavilySearches = 0;

    if (usageData) {
      usageData.forEach(row => {
        totalTokens += Number(row.total_tokens_used || 0);
        oracleUses += Number(row.oracle_uses_today || 0);
        tavilySearches += Number(row.tavily_searches_today || 0);
      });
    }

    // 2. Fetch recent upgrade requests (Manual Approval Workflow)
    const { data: upgradeRequests } = await supabaseAdmin
      .from('upgrade_requests')
      .select('*, users(email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20)
      .catch(() => ({ data: [] })); // Graceful fallback if table not yet migrated

    return NextResponse.json({
      status: 'success',
      data: {
        telemetry: {
          totalUsers: totalUsers || 0,
          dailyActiveUsers: dailyActiveUsers || 0,
          totalTokens,
          oracleUses,
          tavilySearches,
        },
        pendingRequests: upgradeRequests || []
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


