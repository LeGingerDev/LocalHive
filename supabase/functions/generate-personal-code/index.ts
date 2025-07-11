import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // CORS headers for local dev/testing
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  // Get environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get user from JWT
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  const jwt = authHeader.replace("Bearer ", "")
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(jwt)
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Generate a unique code
  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = "HIVE-"
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Check if user already has a code
  const { data: profile } = await supabase
    .from("profiles")
    .select("personal_code")
    .eq("id", user.id)
    .single()

  if (profile?.personal_code) {
    return new Response(JSON.stringify({ personal_code: profile.personal_code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Try to generate a unique code (retry if collision)
  let newCode = ""
  let attempts = 0
  while (attempts < 5) {
    newCode = generateCode()
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("personal_code", newCode)
      .maybeSingle()
    if (!existing) break
    attempts++
  }
  if (attempts === 5) {
    return new Response(JSON.stringify({ error: "Could not generate unique code" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Save the code to the user's profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ personal_code: newCode })
    .eq("id", user.id)

  if (updateError) {
    return new Response(JSON.stringify({ error: "Failed to update profile" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ personal_code: newCode }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
