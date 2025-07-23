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
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    )

    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(`🗑️ Starting deletion for user: ${user.id}`)

    // Step 1: Delete all user data from database tables
    const { data: deleteResult, error: deleteError } = await supabaseClient.rpc(
      "delete_user_data",
      { target_user_id: user.id },
    )

    if (deleteError) {
      console.error("❌ Database deletion failed:", deleteError)
      return new Response(
        JSON.stringify({ error: "Failed to delete user data", details: deleteError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    console.log("✅ Database data deleted:", deleteResult)

    // Step 2: Delete the user from Supabase Auth using Admin API
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      console.error("❌ Auth user deletion failed:", authDeleteError)
      return new Response(
        JSON.stringify({
          error: "Failed to delete auth user",
          details: authDeleteError,
          note: "Database data was deleted but auth user remains",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    console.log("✅ Auth user deleted successfully")

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "User account and all data deleted successfully",
        user_id: user.id,
        deleted_at: new Date().toISOString(),
        database_deletion: deleteResult,
        auth_deletion: "success",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
