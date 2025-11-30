import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Reminder {
  id: string
  name: string
  reminder_type: string
  trigger_days: number
  action_type: string
  action_config: any
  is_active: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[process-reminders] Starting reminder processing...')

    // Buscar lembretes ativos
    const { data: reminders, error: remindersError } = await supabase
      .from('automated_reminders')
      .select('*')
      .eq('is_active', true)

    if (remindersError) throw remindersError

    console.log(`[process-reminders] Found ${reminders?.length || 0} active reminders`)

    let processedCount = 0
    let errorCount = 0

    for (const reminder of reminders || []) {
      try {
        await processReminder(supabase, reminder)
        processedCount++
      } catch (error) {
        console.error(`[process-reminders] Error processing reminder ${reminder.id}:`, error)
        errorCount++
      }
    }

    console.log(`[process-reminders] Completed: ${processedCount} processed, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount, 
        errors: errorCount,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[process-reminders] Fatal error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processReminder(supabase: any, reminder: Reminder) {
  console.log(`[process-reminders] Processing reminder: ${reminder.name} (${reminder.reminder_type})`)

  switch (reminder.reminder_type) {
    case 'followup_inactive':
      await processFollowupInactive(supabase, reminder)
      break
    case 'proposal_expiring':
      await processProposalExpiring(supabase, reminder)
      break
    case 'task_overdue':
      await processTaskOverdue(supabase, reminder)
      break
    default:
      console.log(`[process-reminders] Unknown reminder type: ${reminder.reminder_type}`)
  }
}

async function processFollowupInactive(supabase: any, reminder: Reminder) {
  // Buscar leads sem contato há X dias
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - reminder.trigger_days)

  const { data: inactiveLeads, error } = await supabase
    .from('leads')
    .select('id, name, email, assigned_to, last_contact_date')
    .eq('status', 'em_contato')
    .is('deleted_at', null)
    .or(`last_contact_date.is.null,last_contact_date.lt.${cutoffDate.toISOString()}`)

  if (error) throw error

  console.log(`[followup_inactive] Found ${inactiveLeads?.length || 0} inactive leads`)

  for (const lead of inactiveLeads || []) {
    await executeReminderAction(supabase, reminder, lead)
  }
}

async function processProposalExpiring(supabase: any, reminder: Reminder) {
  // Buscar propostas que vencem em X dias
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + reminder.trigger_days)
  const today = new Date()

  const { data: expiringProposals, error } = await supabase
    .from('proposals')
    .select(`
      id, 
      proposal_number, 
      valid_until,
      status,
      lead_id,
      leads (id, name, email, assigned_to)
    `)
    .in('status', ['draft', 'sent'])
    .gte('valid_until', today.toISOString().split('T')[0])
    .lte('valid_until', futureDate.toISOString().split('T')[0])

  if (error) throw error

  console.log(`[proposal_expiring] Found ${expiringProposals?.length || 0} expiring proposals`)

  for (const proposal of expiringProposals || []) {
    await executeReminderAction(supabase, reminder, {
      ...proposal.leads,
      proposal_number: proposal.proposal_number,
      valid_until: proposal.valid_until
    })
  }
}

async function processTaskOverdue(supabase: any, reminder: Reminder) {
  // Buscar tarefas atrasadas
  const today = new Date().toISOString()

  const { data: overdueTasks, error } = await supabase
    .from('activities')
    .select(`
      id,
      subject,
      due_date,
      created_by,
      lead_id,
      leads (id, name, email, assigned_to)
    `)
    .eq('completed', false)
    .lt('due_date', today)

  if (error) throw error

  console.log(`[task_overdue] Found ${overdueTasks?.length || 0} overdue tasks`)

  for (const task of overdueTasks || []) {
    await executeReminderAction(supabase, reminder, {
      ...task.leads,
      task_subject: task.subject,
      task_due_date: task.due_date,
      task_owner: task.created_by
    })
  }
}

async function executeReminderAction(supabase: any, reminder: Reminder, data: any) {
  console.log(`[execute_action] Executing ${reminder.action_type} for ${data.name}`)

  switch (reminder.action_type) {
    case 'notification':
      await createNotification(supabase, reminder, data)
      break
    case 'email':
      await sendReminderEmail(supabase, reminder, data)
      break
    case 'task':
      await createReminderTask(supabase, reminder, data)
      break
  }
}

async function createNotification(supabase: any, reminder: Reminder, data: any) {
  const userId = data.assigned_to || data.task_owner

  if (!userId) {
    console.log('[notification] No user assigned, skipping')
    return
  }

  const title = reminder.action_config?.title || reminder.name
  const message = replaceVariables(
    reminder.action_config?.message || 'Lembrete automático',
    data
  )

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type: 'reminder',
    entity_type: 'leads',
    entity_id: data.id
  })

  if (error) throw error
  console.log(`[notification] Created for user ${userId}`)
}

async function sendReminderEmail(supabase: any, reminder: Reminder, data: any) {
  if (!data.email) {
    console.log('[email] No email found, skipping')
    return
  }

  const subject = replaceVariables(
    reminder.action_config?.subject || reminder.name,
    data
  )
  const body = replaceVariables(
    reminder.action_config?.body || 'Este é um lembrete automático.',
    data
  )

  const { error } = await supabase.functions.invoke('send-lead-email', {
    body: {
      leadId: data.id,
      to: data.email,
      subject,
      body
    }
  })

  if (error) throw error
  console.log(`[email] Sent to ${data.email}`)
}

async function createReminderTask(supabase: any, reminder: Reminder, data: any) {
  const userId = data.assigned_to || data.task_owner

  if (!userId) {
    console.log('[task] No user assigned, skipping')
    return
  }

  const subject = replaceVariables(
    reminder.action_config?.title || reminder.name,
    data
  )
  const description = replaceVariables(
    reminder.action_config?.description || 'Tarefa criada automaticamente',
    data
  )

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + (reminder.action_config?.due_days || 1))

  const { error } = await supabase.from('activities').insert({
    lead_id: data.id,
    type: 'task',
    subject,
    description,
    due_date: dueDate.toISOString(),
    created_by: userId,
    completed: false
  })

  if (error) throw error
  console.log(`[task] Created for user ${userId}`)
}

function replaceVariables(template: string, data: any): string {
  return template
    .replace(/\{\{nome\}\}/g, data.name || '')
    .replace(/\{\{email\}\}/g, data.email || '')
    .replace(/\{\{telefone\}\}/g, data.phone || '')
    .replace(/\{\{proposta\}\}/g, data.proposal_number || '')
    .replace(/\{\{validade\}\}/g, data.valid_until || '')
    .replace(/\{\{tarefa\}\}/g, data.task_subject || '')
    .replace(/\{\{vencimento\}\}/g, data.task_due_date || '')
}
