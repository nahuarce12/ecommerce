import { createServiceClient } from '@/lib/supabase/server'

type EmailType = 'welcome' | 'order_confirmation' | 'payment_approved' | 'order_shipped'

export async function sendNotificationEmail(
  type: EmailType,
  to: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = createServiceClient()

    const { error } = await supabase.functions.invoke('send-email', {
      body: { type, to, data },
    })

    if (error) {
      console.error(`[email] Failed to send ${type} to ${to}:`, error)
    } else {
      console.log(`[email] Sent ${type} to ${to}`)
    }
  } catch (err) {
    console.error(`[email] Unexpected error sending ${type} to ${to}:`, err)
  }
}

export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.auth.admin.getUserById(userId)

    if (error || !data?.user?.email) {
      console.error('[email] Could not get user email:', error)
      return null
    }

    return data.user.email
  } catch (err) {
    console.error('[email] Unexpected error getting user email:', err)
    return null
  }
}
