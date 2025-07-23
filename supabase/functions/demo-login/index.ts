import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    )

    // Check if demo mode is enabled
    const { data: demoData, error: demoError } = await supabaseClient
      .from("demo")
      .select("is_demo")
      .single()

    if (demoError || !demoData?.is_demo) {
      return new Response(JSON.stringify({ success: false, error: "Demo mode is not enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Get demo user from auth.users
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.admin.getUserByEmail("demo@visu.app")

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Demo user not found. Please run create_demo_account() first.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      )
    }

    // Create a session for the demo user
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.admin.generateLink({
      type: "magiclink",
      email: "demo@visu.app",
    })

    if (sessionError) {
      return new Response(JSON.stringify({ success: false, error: sessionError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: "Demo User",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
