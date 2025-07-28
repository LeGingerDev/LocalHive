/**
 * Network utility functions
 */

/**
 * Check if device has network connectivity
 * @returns Promise<boolean>
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Simple network check by trying to fetch a small resource
    const response = await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
    })
    return response.ok
  } catch (error) {
    console.warn("[NetworkUtils] Network connectivity check failed:", error)
    return false
  }
}

/**
 * Wait for network connectivity with timeout
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Promise<boolean>
 */
export async function waitForNetworkConnectivity(timeoutMs: number = 10000): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    if (await checkNetworkConnectivity()) {
      return true
    }

    // Wait 1 second before checking again
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return false
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise<T>
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[NetworkUtils] Attempt ${attempt} failed:`, lastError)

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) // 1s, 2s, 4s
        console.log(`[NetworkUtils] Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error("Operation failed after all retries")
}
