import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // 1. Parse request
    const { query, topK = 10, category = null, similarityThreshold = 0.3 } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({
        error: "Missing query"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log("[VectorSearch] Query received:", query);
    console.log("[VectorSearch] Category filter:", category);
    console.log("[VectorSearch] Similarity threshold:", similarityThreshold);

    // 2. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: "Missing Authorization header"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: "Invalid or missing user"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // 3. Get user's group memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (membershipsError) {
      return new Response(JSON.stringify({
        error: membershipsError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const groupIds = memberships?.map((m) => m.group_id) ?? [];
    if (groupIds.length === 0) {
      // User is not in any groups, return empty result
      return new Response(JSON.stringify({
        items: []
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // 4. Generate embedding from OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: query,
        model: "text-embedding-3-small"
      })
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return new Response(JSON.stringify({
        error: "OpenAI error",
        details: err
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const openaiData = await openaiRes.json();
    const embedding = openaiData.data[0].embedding;

    // 5. Query items table using pgvector, filtered by group_ids
    console.log("User ID:", user.id);
    console.log("Group IDs:", groupIds);
    console.log("Embedding length:", embedding.length);
    
    // First get vector search results
    const { data: vectorResults, error: vectorError } = await supabase.rpc("match_items_by_embedding", {
      query_embedding: embedding,
      match_count: topK * 2, // Get more results to filter from
      group_ids: groupIds
    });

    if (vectorError) {
      console.error("Database error:", vectorError);
      return new Response(JSON.stringify({
        error: vectorError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Apply category and similarity filters
    let filteredResults = vectorResults || [];
    
    // Filter by category if specified
    if (category) {
      filteredResults = filteredResults.filter(item => item.category === category);
      console.log(`[VectorSearch] After category filter (${category}):`, filteredResults.length, "items");
    }
    
    // Filter by similarity threshold
    filteredResults = filteredResults.filter(item => item.similarity >= similarityThreshold);
    console.log(`[VectorSearch] After similarity filter (>=${similarityThreshold}):`, filteredResults.length, "items");
    
    // Limit to topK results
    const data = filteredResults.slice(0, topK);

    console.log("Database results count:", data?.length || 0);
    console.log("Database results:", data);

    // 6. Return results
    return new Response(JSON.stringify({
      items: data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error("Vector search error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 