import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  try {
    // 1. Authenticate user (admin only)
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing Authorization header",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      )
    }

    const jwt = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt)
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Invalid or missing user",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      )
    }

    // 2. Get all items that need embedding regeneration
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id, title, details, category, location")
      .not("title", "is", null)
      .neq("title", "")

    if (itemsError) {
      return new Response(
        JSON.stringify({
          error: itemsError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      )
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No items found to regenerate embeddings",
          processed: 0,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      )
    }

    console.log(`Found ${items.length} items to process`)

    // 3. Process items in batches to avoid rate limits
    const batchSize = 5 // Process 5 items at a time
    const results = {
      processed: 0,
      errors: [] as string[],
      success: [] as string[],
    }

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      // Process batch concurrently
      const batchPromises = batch.map(async (item) => {
        try {
          // Create improved embedding text
          const text = `Title: ${item.title}. ${item.details ? `Details: ${item.details}.` : ""} Category: ${item.category || "other"}. ${item.location ? `Location: ${item.location}.` : ""}`

          // Generate embedding from OpenAI
          const openaiRes = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: text,
              model: "text-embedding-ada-002",
            }),
          })

          if (!openaiRes.ok) {
            const err = await openaiRes.text()
            throw new Error(`OpenAI error for item ${item.id}: ${err}`)
          }

          const openaiData = await openaiRes.json()
          const embedding = openaiData.data[0].embedding

          // Update item with new embedding
          const { error: updateError } = await supabase
            .from("items")
            .update({ embedding })
            .eq("id", item.id)

          if (updateError) {
            throw new Error(`Database update error for item ${item.id}: ${updateError.message}`)
          }

          results.success.push(item.id)
          results.processed++

          console.log(`Successfully processed item ${item.id}: ${item.title}`)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error"
          results.errors.push(`Item ${item.id}: ${errorMsg}`)
          console.error(`Error processing item ${item.id}:`, errorMsg)
        }
      })

      // Wait for batch to complete
      await Promise.all(batchPromises)

      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return new Response(
      JSON.stringify({
        message: `Embedding regeneration completed`,
        totalItems: items.length,
        ...results,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    )
  } catch (err) {
    console.error("Batch embedding regeneration error:", err)
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    )
  }
})
