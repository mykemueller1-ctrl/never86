'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { opsDb } from '@/lib/opsDb';

function adminAuthorized(): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const expected = crypto.createHash('sha256').update(pw).digest('hex');
  const got = cookies().get('n86_admin_auth')?.value;
  return !!got && got === expected;
}

function requireAdmin() {
  if (!adminAuthorized()) throw new Error('Not authorized.');
}

function asString(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

export async function addFocus(formData: FormData) {
  requireAdmin();
  const author = asString(formData.get('author')) || 'myke';
  const body = asString(formData.get('body'));
  const status = asString(formData.get('status')) || null;
  if (!body) return;
  const sql = opsDb();
  await sql`INSERT INTO admin.daily_focus (author, body, status) VALUES (${author}, ${body}, ${status})`;
  revalidatePath('/admin/never86');
}

export async function updateFocusStatus(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get('id'));
  const status = asString(formData.get('status'));
  if (!id || !status) return;
  const sql = opsDb();
  await sql`UPDATE admin.daily_focus SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
  revalidatePath('/admin/never86');
}

export async function addAeoDraft(formData: FormData) {
  requireAdmin();
  const author = asString(formData.get('author')) || 'myke';
  const title = asString(formData.get('title'));
  const question = asString(formData.get('question')) || null;
  const answer = asString(formData.get('answer'));
  const audience = asString(formData.get('audience')) || null;
  if (!title || !answer) return;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  const sql = opsDb();
  await sql`INSERT INTO admin.aeo_drafts (author, title, slug, question, answer, audience)
            VALUES (${author}, ${title}, ${slug}, ${question}, ${answer}, ${audience})`;
  revalidatePath('/admin/never86');
}

export async function addTeamNote(formData: FormData) {
  requireAdmin();
  const author = asString(formData.get('author'));
  const kind = asString(formData.get('kind')) || 'note';
  const title = asString(formData.get('title')) || null;
  const body = asString(formData.get('body'));
  if (!author || !body) return;
  const sql = opsDb();
  await sql`INSERT INTO admin.team_notes (author, kind, title, body)
            VALUES (${author}, ${kind}, ${title}, ${body})`;
  revalidatePath('/admin/never86');
}

export async function addPipelineRow(formData: FormData) {
  requireAdmin();
  const name = asString(formData.get('operator_name'));
  const contact = asString(formData.get('contact_name')) || null;
  const units = Number(formData.get('units')) || null;
  const stage = asString(formData.get('stage')) || 'lead';
  const notes = asString(formData.get('notes')) || null;
  const nextStep = asString(formData.get('next_step')) || null;
  if (!name) return;
  const sql = opsDb();
  await sql`INSERT INTO admin.operator_pipeline (operator_name, contact_name, units, stage, notes, next_step)
            VALUES (${name}, ${contact}, ${units}, ${stage}, ${notes}, ${nextStep})`;
  revalidatePath('/admin/never86');
}

export async function updatePipelineStage(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get('id'));
  const stage = asString(formData.get('stage'));
  if (!id || !stage) return;
  const sql = opsDb();
  await sql`UPDATE admin.operator_pipeline SET stage = ${stage}, updated_at = NOW() WHERE id = ${id}`;
  revalidatePath('/admin/never86');
}

import { sendFollowupEmail } from '@/lib/email';

export async function sendFollowupNow(formData: FormData) {
  requireAdmin();
  const leadId = Number(formData.get('leadId'));
  const kind = (formData.get('kind') as '24h' | '7d') || '24h';
  if (!leadId) return;
  const sql = opsDb();
  const rows = await sql<{ email: string; name: string | null; requested_agent: string | null }[]>`
    SELECT email, name, requested_agent FROM admin.leads WHERE id = ${leadId} LIMIT 1
  `;
  const lead = rows[0];
  if (!lead?.email) return;
  try {
    await sendFollowupEmail({
      to: lead.email,
      firstName: lead.name ?? undefined,
      agentName: lead.requested_agent ?? undefined,
      kind,
    });
    if (kind === '24h') {
      await sql`UPDATE admin.leads SET followup_24h_sent_at = NOW() WHERE id = ${leadId}`;
    } else {
      await sql`UPDATE admin.leads SET followup_7d_sent_at = NOW() WHERE id = ${leadId}`;
    }
    // Mark the queued row sent too so cron doesn't double-send.
    await sql`
      UPDATE admin.followup_queue
         SET status = 'sent', sent_at = NOW(), notes = 'manual-send-from-admin'
       WHERE lead_id = ${leadId} AND kind = ${kind} AND status IN ('pending', 'sending')
    `;
  } catch (err) {
    console.error('sendFollowupNow failed', err);
  }
  revalidatePath('/admin/never86');
}

export async function markOutboundSent(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get('id'));
  const templateUsed = asString(formData.get('template'));
  if (!id) return;
  const sql = opsDb();
  await sql`
    UPDATE admin.outbound_targets
       SET status = 'sent', sent_at = NOW(), template_used = ${templateUsed || null}, updated_at = NOW()
     WHERE id = ${id}
  `;
  revalidatePath('/admin/never86');
}

export async function markOutboundReplied(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) return;
  const sql = opsDb();
  await sql`
    UPDATE admin.outbound_targets
       SET status = 'replied', replied_at = NOW(), updated_at = NOW()
     WHERE id = ${id}
  `;
  revalidatePath('/admin/never86');
}

export async function markOutboundPassed(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get('id'));
  const reason = asString(formData.get('reason'));
  if (!id) return;
  const sql = opsDb();
  await sql`
    UPDATE admin.outbound_targets
       SET status = 'passed', notes_internal = ${reason || null}, updated_at = NOW()
     WHERE id = ${id}
  `;
  revalidatePath('/admin/never86');
}
