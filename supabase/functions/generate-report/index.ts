import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { childName, childAge, observations, period, year } = await req.json()

    if (!childName || !childAge || !observations || !period || !year) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get API key from environment
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build observations list
    const observationsList = observations
      .map((o: any, i: number) => `${i + 1}. [${o.domains.join(', ')}] ${o.cleaned_text}`)
      .join('\n')

    // Call Claude API
    const prompt = `You are an expert early childhood educator writing a bi-annual developmental report for a preschool child.

Child: ${childName}, Age: ${childAge}
Report Period: ${period} ${year}

Here are the teacher's observations from this period:
${observationsList}

Write a warm, professional bi-annual developmental report for this child's parents. The report should:
- Open with a warm introduction about the child
- Cover each developmental domain that appeared in observations
- Use specific examples from the observations
- Be encouraging and highlight growth
- Close with a forward-looking statement
- Be 300-500 words total
- Sound like it was written by a caring, professional teacher

Write the report directly, no preamble or headers needed.`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('Anthropic API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropicData = await anthropicResponse.json()
    const report = anthropicData.content[0].text

    return new Response(
      JSON.stringify({ report }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
