import { corsHeaders } from '../_shared/cors.ts'

const DEVELOPMENTAL_TAGS = [
  "Cognitive Development",
  "Fine Motor Skills",
  "Gross Motor Skills",
  "Social-Emotional",
  "Language & Communication",
  "Creative Expression",
  "Self-Care & Independence",
  "Problem Solving",
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing authorization header' }, 401)
    }

    const { imageBase64, mimeType, roster } = await req.json()
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return json({ error: 'Missing imageBase64' }, 400)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return json({ error: 'Server configuration error' }, 500)
    }

    const mt = typeof mimeType === 'string' && /^image\/(png|jpe?g|webp)$/.test(mimeType)
      ? mimeType
      : 'image/jpeg'

    const rosterList = Array.isArray(roster)
      ? roster.map((r: any) => `- ${r.firstName} ${r.lastName || ''}`.trim()).join('\n')
      : '(roster unknown)'

    const prompt = `You are reading a preschool teacher's handwritten clipboard page.
Each line or block typically has a child's first name followed by a short note about what that child did.

The class roster is:
${rosterList}

Extract every observation you can see. For each one:
- Match the child name to the roster when possible. If the handwriting is unclear, return your best guess and mark confidence "low".
- Capture the note as written (cleaned for grammar, preserving meaning).
- Tag with 1-3 developmental domains from this list:
${DEVELOPMENTAL_TAGS.map((t) => `- ${t}`).join('\n')}

Return ONLY JSON (no markdown, no prose), in this exact shape:
{
  "items": [
    { "childName": string, "note": string, "tags": string[], "confidence": "high" | "medium" | "low" }
  ]
}

If no observations are visible, return { "items": [] }.`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mt, data: imageBase64 } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('Anthropic API error:', errorText)
      return json({ error: 'AI service error', detail: errorText.slice(0, 500) }, 500)
    }

    const anthropicData = await anthropicResponse.json()
    const responseText = anthropicData.content?.[0]?.text ?? ''

    let parsed: any = null
    try {
      parsed = JSON.parse(responseText)
    } catch {
      const m = responseText.match(/\{[\s\S]*\}/)
      if (m) {
        try { parsed = JSON.parse(m[0]) } catch {}
      }
    }

    if (!parsed || !Array.isArray(parsed.items)) {
      return json({ items: [], debug: responseText.slice(0, 400) })
    }

    const items = parsed.items
      .filter((it: any) => it && typeof it.childName === 'string' && typeof it.note === 'string')
      .map((it: any) => ({
        childName: String(it.childName).trim(),
        note: String(it.note).trim(),
        tags: Array.isArray(it.tags)
          ? it.tags.filter((t: string) => DEVELOPMENTAL_TAGS.includes(t)).slice(0, 3)
          : [],
        confidence: ['high', 'medium', 'low'].includes(it.confidence) ? it.confidence : 'medium',
      }))

    return json({ items })
  } catch (error: any) {
    console.error('Error:', error)
    return json({ error: error?.message || 'Internal server error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
