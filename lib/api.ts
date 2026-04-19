import { supabase } from './supabase'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return `Bearer ${session?.access_token}`
}

export async function getTeacherId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase.from('ll_teachers').select('id').eq('user_id', user!.id).single()
  return data!.id
}

export async function tagObservation(text: string): Promise<{ domains: string[], cleaned_text: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/tag-observation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw new Error('Failed to tag observation')
  return response.json()
}

export async function generateReport(params: {
  childName: string
  childAge: string
  observations: Array<{ cleaned_text: string, domains: string[], created_at: string }>
  period: string
  year: number
}): Promise<{ report: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to generate report')
  return response.json()
}

export interface ScannedItem {
  childName: string
  note: string
  tags: string[]
  confidence: 'high' | 'medium' | 'low'
}

export async function scanHandwrittenNotes(params: {
  imageBase64: string
  mimeType: string
  roster: Array<{ id: string; firstName: string; lastName: string }>
}): Promise<{ items: ScannedItem[] }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-observations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to scan notes')
  return response.json()
}
