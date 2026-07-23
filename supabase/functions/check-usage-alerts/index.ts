import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Shared client for invoking other functions
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (_req) => {
  try {
    // 1. Get the start of the current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 2. Fetch all users who have push tokens
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, expo_push_token')
      .not('expo_push_token', 'is', null);

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users with push tokens found.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Process each user
    for (const user of users) {
      // 4. Fetch the user's settings and budget individually
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('usage_alerts')
        .eq('user_id', user.id)
        .single();

      if (settingsError || !settings || !settings.usage_alerts) {
        // Skip user if they have no settings, or if usage_alerts is disabled
        continue;
      }

      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('monthly_limit, alert_threshold_pct, is_active')
        .eq('user_id', user.id)
        .single();

      if (budgetError || !budget || !budget.is_active) {
        // Skip user if they have no budget, or if it's inactive
        continue;
      }

      // 5. Calculate total consumption for the current month
      const { data: energyLogs, error: logsError } = await supabase
        .from('energy_logs')
        .select('kwh_consumed')
        .eq('user_id', user.id)
        .gte('date', startDate);

      if (logsError) {
        console.error(`Error fetching energy logs for user ${user.id}:`, logsError);
        continue;
      }

      const totalKwh = energyLogs.reduce((acc, log) => acc + log.kwh_consumed, 0);

      // 6. Check if consumption exceeds the threshold
      const alertThreshold = (budget.monthly_limit * budget.alert_threshold_pct) / 100;

      if (totalKwh > alertThreshold) {
        // 7. Send push notification
        const { error: notificationError } = await supabase.functions.invoke('send-notification', {
          body: {
            expo_push_token: user.expo_push_token,
            title: 'High Usage Alert!',
            message: `You have consumed ${totalKwh.toFixed(2)} kWh this month, exceeding your alert threshold of ${alertThreshold.toFixed(2)} kWh.`,
          },
        });

        if (notificationError) {
          console.error(`Failed to send notification to user ${user.id}:`, notificationError);
        } else {
          console.log(`High usage alert sent to user ${user.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ message: `Checked ${users.length} users for high usage.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in check-usage-alerts function:', error);
    return new Response(error.message, { status: 500 });
  }
});
