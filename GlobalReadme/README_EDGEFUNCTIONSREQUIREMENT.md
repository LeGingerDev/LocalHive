# Supabase Edge Functions Guide for React Native

A comprehensive guide for implementing serverless Edge Functions with Supabase to handle backend logic for your React Native applications. This guide focuses on practical implementation patterns and security best practices.

## Table of Contents
- [Why Edge Functions for Mobile Apps](#why-edge-functions-for-mobile-apps)
- [Setting Up Edge Functions in Supabase](#setting-up-edge-functions-in-supabase)
- [Common Edge Function Patterns](#common-edge-function-patterns)
- [React Native Integration](#react-native-integration)
- [Security & Rate Limiting](#security--rate-limiting)
- [Testing & Debugging](#testing--debugging)
- [Production Deployment](#production-deployment)

## Why Edge Functions for Mobile Apps

### Problems with Direct Database Access
When your React Native app talks directly to Supabase:
- **Security risk**: Database credentials exposed in client
- **No rate limiting**: Users can spam expensive queries
- **No validation**: Malicious data can be inserted
- **Complex joins**: Heavy database operations on mobile network
- **Business logic**: Scattered between client and database

### Edge Functions as Your API Gateway
```
❌ Bad:  [React Native] → [Supabase Database]
✅ Good: [React Native] → [Edge Function] → [Supabase Database]
```

**Edge Functions provide:**
- Server-side validation and business logic
- Rate limiting and abuse prevention
- Data transformation and caching
- Secure API key management
- Global CDN distribution for low latency

## Setting Up Edge Functions in Supabase

### 1. Install Supabase CLI
```bash
# Install globally
npm install -g supabase

# Or use npx for latest version
npx supabase --version

# Login to your Supabase account
supabase login
```

### 2. Initialize Local Development
```bash
# Create a new directory for your functions
mkdir my-app-backend
cd my-app-backend

# Initialize Supabase project
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your project ref:**
- Go to your Supabase dashboard
- Project Settings → General → Reference ID

### 3. Create Your First Edge Function
```bash
# Create a new function
supabase functions new hello-world

# This creates: supabase/functions/hello-world/index.ts
```

### 4. Folder Structure After Setup
```
my-app-backend/
├── supabase/
│   ├── functions/
│   │   ├── hello-world/
│   │   │   └── index.ts
│   │   ├── submit-score/
│   │   │   └── index.ts
│   │   └── validate-purchase/
│   │       └── index.ts
│   ├── config.toml
│   └── .env
├── package.json
└── README.md
```

### 5. Local Development Server
```bash
# Start local Supabase (includes Edge Functions)
supabase start

# This will show you:
# - API URL: http://localhost:54321
# - GraphQL URL: http://localhost:54321/graphql/v1
# - Studio URL: http://localhost:54323
# - Inbucket URL: http://localhost:54324
# - JWT secret: [generated]
# - anon key: [generated]
# - service_role key: [generated]

# Serve functions locally for development
supabase functions serve

# Serve specific function
supabase functions serve hello-world --env-file supabase/.env
```

## Common Edge Function Patterns

### 1. Game Leaderboard Submission
```typescript
// supabase/functions/submit-score/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ScoreRequest {
  score: number
  playerName: string
  gameMode: string
  gameSession: string
}

serve(async (req) => {
  // CORS headers for React Native
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Parse request body
    const { score, playerName, gameMode, gameSession }: ScoreRequest = await req.json()

    // Validation (your gatekeeper logic)
    if (!score || score < 0 || score > 1000000) {
      return new Response(
        JSON.stringify({ error: 'Invalid score range' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!playerName || playerName.length > 50 || playerName.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid player name' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check (simple IP-based)
    const userIP = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Create Supabase client with service role (bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Invalid token', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Check for duplicate submissions (prevent cheating)
    const { data: existingScore } = await supabase
      .from('leaderboard')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_session', gameSession)
      .single()

    if (existingScore) {
      return new Response(
        JSON.stringify({ error: 'Score already submitted for this session' }), 
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert score with server timestamp
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([
        {
          score: score,
          player_name: playerName,
          game_mode: gameMode,
          game_session: gameSession,
          user_id: user.id,
          submitted_at: new Date().toISOString(),
          ip_address: userIP,
          verified: true // Server-side verification
        }
      ])
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to submit score' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate user's rank
    const { count } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('game_mode', gameMode)
      .gt('score', score)

    const rank = (count || 0) + 1

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Score submitted successfully',
        rank: rank,
        score: score
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 2. In-App Purchase Validation
```typescript
// supabase/functions/validate-purchase/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PurchaseRequest {
  platform: 'ios' | 'android'
  receiptData: string
  productId: string
  transactionId: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { platform, receiptData, productId, transactionId }: PurchaseRequest = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Invalid token', { status: 401, headers: corsHeaders })
    }

    // Check for duplicate transaction
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('transaction_id', transactionId)
      .single()

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: 'Purchase already processed' }), 
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate receipt with platform store
    let validationResult
    if (platform === 'ios') {
      validationResult = await validateAppleReceipt(receiptData)
    } else {
      validationResult = await validateGoogleReceipt(receiptData)
    }

    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid receipt' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record purchase
    const { error: insertError } = await supabase
      .from('purchases')
      .insert([
        {
          user_id: user.id,
          product_id: productId,
          transaction_id: transactionId,
          platform: platform,
          amount: validationResult.amount,
          currency: validationResult.currency,
          verified_at: new Date().toISOString(),
          receipt_data: receiptData
        }
      ])

    if (insertError) {
      throw insertError
    }

    // Grant premium features or items
    await grantPurchaseRewards(user.id, productId, supabase)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Purchase validated and processed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Purchase validation error:', error)
    return new Response(
      JSON.stringify({ error: 'Validation failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function validateAppleReceipt(receiptData: string) {
  // Apple receipt validation logic
  const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': Deno.env.get('APPLE_SHARED_SECRET')
    })
  })
  
  const result = await response.json()
  return {
    valid: result.status === 0,
    amount: result.receipt?.in_app?.[0]?.product_id ? 4.99 : 0, // Map product to price
    currency: 'USD'
  }
}

async function validateGoogleReceipt(receiptData: string) {
  // Google Play receipt validation logic
  // Implementation depends on your Google Play setup
  return { valid: true, amount: 4.99, currency: 'USD' }
}

async function grantPurchaseRewards(userId: string, productId: string, supabase: any) {
  // Grant user the purchased items/features
  switch (productId) {
    case 'premium_upgrade':
      await supabase
        .from('user_profiles')
        .update({ is_premium: true })
        .eq('id', userId)
      break
    case 'coin_pack_100':
      await supabase.rpc('add_coins', { user_id: userId, amount: 100 })
      break
  }
}
```

### 3. Complex Data Aggregation
```typescript
// supabase/functions/leaderboard-stats/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const gameMode = url.searchParams.get('gameMode') || 'classic'
    const timeframe = url.searchParams.get('timeframe') || 'all'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Build time filter
    let timeFilter = ''
    const now = new Date()
    switch (timeframe) {
      case 'today':
        timeFilter = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        timeFilter = weekAgo.toISOString()
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        timeFilter = monthAgo.toISOString()
        break
    }

    // Complex aggregation query
    let query = supabase
      .from('leaderboard')
      .select(`
        id,
        score,
        player_name,
        user_id,
        submitted_at,
        user_profiles!inner(avatar_url, level)
      `)
      .eq('game_mode', gameMode)
      .order('score', { ascending: false })
      .limit(100)

    if (timeFilter) {
      query = query.gte('submitted_at', timeFilter)
    }

    const { data: leaderboard, error } = await query

    if (error) {
      throw error
    }

    // Calculate additional stats
    const stats = {
      totalPlayers: leaderboard?.length || 0,
      averageScore: leaderboard?.reduce((sum, entry) => sum + entry.score, 0) / (leaderboard?.length || 1) || 0,
      highestScore: leaderboard?.[0]?.score || 0,
      topPlayers: leaderboard?.slice(0, 10).map((entry, index) => ({
        rank: index + 1,
        playerName: entry.player_name,
        score: entry.score,
        avatarUrl: entry.user_profiles?.avatar_url,
        level: entry.user_profiles?.level
      })) || []
    }

    return new Response(
      JSON.stringify({
        success: true,
        gameMode,
        timeframe,
        stats,
        leaderboard: stats.topPlayers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Leaderboard stats error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch leaderboard stats' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## React Native Integration

### 1. Edge Function Service Class
```typescript
// src/services/EdgeFunctionService.ts
interface EdgeFunctionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

class EdgeFunctionService {
  private baseUrl: string
  private apiKey: string
  private userToken: string | null = null

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1'
    this.apiKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  }

  setUserToken(token: string) {
    this.userToken = token
  }

  private async makeRequest<T>(
    functionName: string, 
    data?: any, 
    method: 'GET' | 'POST' = 'POST'
  ): Promise<EdgeFunctionResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
      }

      if (this.userToken) {
        headers['Authorization'] = `Bearer ${this.userToken}`
      }

      const config: RequestInit = {
        method,
        headers,
      }

      if (data && method === 'POST') {
        config.body = JSON.stringify(data)
      }

      const url = method === 'GET' && data 
        ? `${this.baseUrl}/${functionName}?${new URLSearchParams(data).toString()}`
        : `${this.baseUrl}/${functionName}`

      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error(`Edge function ${functionName} error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Specific function methods
  async submitScore(scoreData: {
    score: number
    playerName: string
    gameMode: string
    gameSession: string
  }) {
    return this.makeRequest('submit-score', scoreData)
  }

  async validatePurchase(purchaseData: {
    platform: 'ios' | 'android'
    receiptData: string
    productId: string
    transactionId: string
  }) {
    return this.makeRequest('validate-purchase', purchaseData)
  }

  async getLeaderboardStats(params: {
    gameMode?: string
    timeframe?: 'today' | 'week' | 'month' | 'all'
  } = {}) {
    return this.makeRequest('leaderboard-stats', params, 'GET')
  }

  async sendNotification(notificationData: {
    userId: string
    title: string
    message: string
    data?: any
  }) {
    return this.makeRequest('send-notification', notificationData)
  }
}

export default new EdgeFunctionService()
```

### 2. React Hook Integration
```typescript
// src/hooks/useEdgeFunctions.ts
import { useState } from 'react'
import EdgeFunctionService from '@services/EdgeFunctionService'
import { useAuth } from './useAuth'

export const useEdgeFunctions = () => {
  const { user, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set user token when available
  if (session?.access_token) {
    EdgeFunctionService.setUserToken(session.access_token)
  }

  const submitScore = async (scoreData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await EdgeFunctionService.submitScore(scoreData)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit score')
      }
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const validatePurchase = async (purchaseData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await EdgeFunctionService.validatePurchase(purchaseData)
      
      if (!result.success) {
        throw new Error(result.error || 'Purchase validation failed')
      }
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getLeaderboardStats = async (params = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await EdgeFunctionService.getLeaderboardStats(params)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leaderboard')
      }
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    submitScore,
    validatePurchase,
    getLeaderboardStats,
  }
}
```

### 3. Usage in Components
```typescript
// src/screens/GameOverScreen/index.tsx
import React, { useState } from 'react'
import { View, Text, Button, Alert } from 'react-native'
import { useEdgeFunctions } from '@hooks/useEdgeFunctions'
import { LoadingSpinner } from '@components'

const GameOverScreen = ({ route, navigation }) => {
  const { score, gameMode, gameSession } = route.params
  const { submitScore, loading, error } = useEdgeFunctions()
  const [submitted, setSubmitted] = useState(false)

  const handleSubmitScore = async () => {
    try {
      const result = await submitScore({
        score,
        playerName: 'CurrentUser', // Get from user profile
        gameMode,
        gameSession
      })

      setSubmitted(true)
      
      Alert.alert(
        'Score Submitted!', 
        `Your rank: #${result.rank}\nScore: ${result.score}`,
        [{ text: 'OK', onPress: () => navigation.navigate('Leaderboard') }]
      )
    } catch (err) {
      Alert.alert('Error', 'Failed to submit score. Please try again.')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Game Over!</Text>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Final Score: {score}</Text>
      
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      
      {!submitted && (
        <Button 
          title="Submit Score" 
          onPress={handleSubmitScore}
          disabled={loading}
        />
      )}
      
      <Button 
        title="Play Again" 
        onPress={() => navigation.navigate('Game')}
      />
    </View>
  )
}

export default GameOverScreen
```

## Security & Rate Limiting

### 1. Rate Limiting Pattern
```typescript
// supabase/functions/_shared/rateLimiter.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimit {
  requests: number
  windowMs: number
}

const RATE_LIMITS: Record<string, RateLimit> = {
  'submit-score': { requests: 10, windowMs: 60000 }, // 10 requests per minute
  'validate-purchase': { requests: 5, windowMs: 60000 }, // 5 requests per minute
  'leaderboard-stats': { requests: 60, windowMs: 60000 }, // 60 requests per minute
}

export async function checkRateLimit(
  functionName: string, 
  identifier: string, // IP or user ID
  supabase: any
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = RATE_LIMITS[functionName]
  if (!limit) return { allowed: true, remaining: 999 }

  const now = Date.now()
  const windowStart = now - limit.windowMs

  // Clean old entries and count current requests
  const { data: requests } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('function_name', functionName)
    .eq('identifier', identifier)
    .gte('timestamp', windowStart)

  const currentRequests = requests?.length || 0

  if (currentRequests >= limit.requests) {
    return { allowed: false, remaining: 0 }
  }

  // Record this request
  await supabase
    .from('rate_limits')
    .insert([{
      function_name: functionName,
      identifier,
      timestamp: now
    }])

  // Clean up old entries (optional, can be done via cron)
  await supabase
    .from('rate_limits')
    .delete()
    .eq('function_name', functionName)
    .eq('identifier', identifier)
    .lt('timestamp', windowStart)

  return { allowed: true, remaining: limit.requests - currentRequests - 1 }
}

// Usage in your Edge Function:
/*
const rateCheck = await checkRateLimit('submit-score', userIP, supabase)
if (!rateCheck.allowed) {
  return new Response('Rate limit exceeded', { status: 429 })
}
*/
```

### 2. Input Validation Helpers
```typescript
// supabase/functions/_shared/validation.ts
export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'email'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export function validateInput(data: any, schema: ValidationSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }

    // Skip further validation if not required and empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue
    }

    // Type validation
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${field} must be a string`)
          }
          break
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${field} must be a number`)
          }
          break
        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailPattern.test(value)) {
            errors.push(`${field} must be a valid email`)
          }
          break
      }
    }

    // String length validation
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`)
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters`)
      }
    }

    // Number range validation
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`)
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be no more than ${rules.max}`)
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// Usage example:
/*
const validation = validateInput(requestData, {
  score: { required: true, type: 'number', min: 0, max: 1000000 },
  playerName: { required: true, type: 'string', minLength: 2, maxLength: 50 },
  gameMode: { required: true, type: 'string', pattern: /^(classic|arcade|time_trial)$/ }
})

if (!validation.valid) {
  return new Response(
    JSON.stringify({ error: validation.errors.join(', ') }), 
    { status: 400 }
  )
}
*/
```

## Testing & Debugging

### 1. Local Testing Setup
```bash
# Start local Supabase stack
supabase start

# In another terminal, serve your functions
supabase functions serve --env-file supabase/.env

# Test your function with curl
curl -X POST 'http://localhost:54321/functions/v1/submit-score' \
  -H 'Authorization: Bearer YOUR_TEST_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "score": 1500,
    "playerName": "TestPlayer",
    "gameMode": "classic",
    "gameSession": "test-session-123"
  }'
```

### 2. Environment Variables Setup
```bash
# supabase/.env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
APPLE_SHARED_SECRET=your_apple_shared_secret
GOOGLE_PLAY_PRIVATE_KEY=your_google_play_key
```

### 3. Debug Function Template
```typescript
// supabase/functions/debug-info/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestInfo = {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString(),
      environment: {
        SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
        hasServiceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      }
    }

    // Log body if present
    if (req.method === 'POST') {
      const body = await req.text()
      requestInfo.body = body ? JSON.parse(body) : null
    }

    console.log('Debug Info:', JSON.stringify(requestInfo, null, 2))

    return new Response(
      JSON.stringify(requestInfo, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Debug function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4. React Native Testing Component
```typescript
// src/screens/TestEdgeFunctions/index.tsx
import React, { useState } from 'react'
import { View, Text, Button, ScrollView, Alert } from 'react-native'
import EdgeFunctionService from '@services/EdgeFunctionService'

const TestEdgeFunctions = () => {
  const [results, setResults] = useState<any[]>([])

  const addResult = (name: string, result: any) => {
    setResults(prev => [...prev, { name, result, timestamp: Date.now() }])
  }

  const testSubmitScore = async () => {
    try {
      const result = await EdgeFunctionService.submitScore({
        score: Math.floor(Math.random() * 10000),
        playerName: 'TestPlayer',
        gameMode: 'classic',
        gameSession: `test-${Date.now()}`
      })
      addResult('Submit Score', result)
    } catch (error) {
      addResult('Submit Score Error', error.message)
    }
  }

  const testLeaderboard = async () => {
    try {
      const result = await EdgeFunctionService.getLeaderboardStats({
        gameMode: 'classic',
        timeframe: 'week'
      })
      addResult('Leaderboard Stats', result)
    } catch (error) {
      addResult('Leaderboard Error', error.message)
    }
  }

  const testDebugInfo = async () => {
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/debug-info',
        {
          method: 'POST',
          headers: {
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ test: 'data' })
        }
      )
      const result = await response.json()
      addResult('Debug Info', result)
    } catch (error) {
      addResult('Debug Info Error', error.message)
    }
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Edge Functions Test</Text>
      
      <View style={{ marginBottom: 20 }}>
        <Button title="Test Submit Score" onPress={testSubmitScore} />
        <Button title="Test Leaderboard" onPress={testLeaderboard} />
        <Button title="Test Debug Info" onPress={testDebugInfo} />
        <Button title="Clear Results" onPress={() => setResults([])} />
      </View>

      <Text style={{ fontSize: 18, marginBottom: 10 }}>Results:</Text>
      
      {results.map((item, index) => (
        <View key={index} style={{ 
          backgroundColor: '#f0f0f0', 
          padding: 10, 
          marginBottom: 10,
          borderRadius: 5 
        }}>
          <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {JSON.stringify(item.result, null, 2)}
          </Text>
        </View>
      ))}
    </ScrollView>
  )
}

export default TestEdgeFunctions
```

## Production Deployment

### 1. Deploy to Supabase
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy submit-score

# Deploy with environment variables
supabase secrets set APPLE_SHARED_SECRET=your_secret_here
supabase secrets set GOOGLE_PLAY_PRIVATE_KEY=your_key_here

# List deployed functions
supabase functions list
```

### 2. Environment Variables for Production
```bash
# Set production secrets
supabase secrets set APPLE_SHARED_SECRET=prod_secret
supabase secrets set GOOGLE_PLAY_PRIVATE_KEY=prod_key
supabase secrets set WEBHOOK_SECRET=webhook_secret

# View current secrets
supabase secrets list
```

### 3. Production React Native Environment
```bash
# .env.production
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# Build for production
eas build --platform all --profile production
```

### 4. Monitoring and Logs
```bash
# View function logs
supabase functions logs submit-score

# Follow logs in real-time
supabase functions logs submit-score --follow

# View logs with filters
supabase functions logs submit-score --since 1h --level error
```

### 5. Performance Optimization

#### Database Indexes
```sql
-- Add indexes for common queries
CREATE INDEX idx_leaderboard_game_mode_score ON leaderboard(game_mode, score DESC);
CREATE INDEX idx_leaderboard_user_session ON leaderboard(user_id, game_session);
CREATE INDEX idx_purchases_transaction ON purchases(transaction_id);
CREATE INDEX idx_rate_limits_function_identifier ON rate_limits(function_name, identifier);

-- Partial indexes for better performance
CREATE INDEX idx_leaderboard_recent ON leaderboard(submitted_at DESC) 
WHERE submitted_at > NOW() - INTERVAL '7 days';
```

#### Caching Strategy
```typescript
// supabase/functions/_shared/cache.ts
interface CacheItem {
  data: any
  expiry: number
}

const cache = new Map<string, CacheItem>()

export function setCache(key: string, data: any, ttlSeconds = 300) {
  cache.set(key, {
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  })
}

export function getCache(key: string): any | null {
  const item = cache.get(key)
  if (!item) return null
  
  if (Date.now() > item.expiry) {
    cache.delete(key)
    return null
  }
  
  return item.data
}

export function clearExpiredCache() {
  const now = Date.now()
  for (const [key, item] of cache.entries()) {
    if (now > item.expiry) {
      cache.delete(key)
    }
  }
}

// Usage in leaderboard function:
/*
const cacheKey = `leaderboard_${gameMode}_${timeframe}`
let stats = getCache(cacheKey)

if (!stats) {
  // Fetch from database
  stats = await fetchLeaderboardStats(gameMode, timeframe)
  setCache(cacheKey, stats, 300) // Cache for 5 minutes
}
*/
```

## Quick Reference Commands

```bash
# Development
supabase start                    # Start local environment
supabase functions serve         # Serve functions locally
supabase functions new myfunction # Create new function

# Testing
curl -X POST localhost:54321/functions/v1/myfunction  # Test locally

# Deployment
supabase functions deploy        # Deploy all functions
supabase secrets set KEY=value   # Set environment variables
supabase functions logs myfunction # View logs

# Maintenance
supabase db reset               # Reset local database
supabase stop                   # Stop local services
```

## Best Practices Summary

1. **Always validate input** on the server side
2. **Implement rate limiting** for all functions
3. **Use CORS headers** for React Native compatibility
4. **Handle authentication** properly with JWT tokens
5. **Log errors** but don't expose sensitive data
6. **Cache expensive operations** when possible
7. **Use database indexes** for performance
8. **Test locally** before deploying to production
9. **Monitor function logs** in production
10. **Keep functions focused** - one responsibility per function

This comprehensive guide should give you everything you need to implement robust Edge Functions for your React Native app with Supabase. The pattern of using Edge Functions as your secure API gateway will solve the direct database access problems and give you a professional, scalable backend architecture.