import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    const { item_id, title, details, category, location } = await req.json()
    if (!item_id || !title) {
      return new Response(
        JSON.stringify({
          error: "Missing item_id or title",
        }),
        {
          status: 400,
        },
      )
    }

    // 1. Generate embedding from OpenAI with improved text structure and newer model
    // Create a more structured and focused embedding text with better weighting
    const text = `Title: ${title}. ${details ? `Details: ${details}.` : ""} Category: ${category || "other"}. ${location ? `Location: ${location}.` : ""}`

    const openaiRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small", // Use newer, faster model
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.text()
      console.error("OpenAI embedding error:", err)
      return new Response(
        JSON.stringify({
          error: "OpenAI error",
          details: err,
        }),
        {
          status: 500,
        },
      )
    }

    const openaiData = await openaiRes.json()
    const embedding = openaiData.data[0].embedding

    // 2. Store embedding in the items table
    const { error } = await supabase
      .from("items")
      .update({
        embedding,
      })
      .eq("id", item_id)

    if (error) {
      console.error("Database update error:", error)
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 500,
        },
      )
    }

    console.log(`Embedding generated successfully for item ${item_id}`)
    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
      },
    )
  } catch (err) {
    console.error("Edge function error:", err)
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 500,
      },
    )
  }
})
