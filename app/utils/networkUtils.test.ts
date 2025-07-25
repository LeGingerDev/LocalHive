import { checkNetworkConnectivity, waitForNetworkConnectivity, retryWithBackoff } from "./networkUtils"

// Mock fetch for testing
global.fetch = jest.fn()

describe("NetworkUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("checkNetworkConnectivity", () => {
    it("should return true when network is available", async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
      
      const result = await checkNetworkConnectivity()
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith("https://www.google.com/favicon.ico", {
        method: "HEAD",
      })
    })

    it("should return false when network is not available", async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))
      
      const result = await checkNetworkConnectivity()
      
      expect(result).toBe(false)
    })

    it("should return false when response is not ok", async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
      
      const result = await checkNetworkConnectivity()
      
      expect(result).toBe(false)
    })
  })

  describe("waitForNetworkConnectivity", () => {
    it("should return true when network becomes available", async () => {
      ;(fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ ok: true })
      
      const result = await waitForNetworkConnectivity(3000)
      
      expect(result).toBe(true)
    })

    it("should return false when timeout is reached", async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error("Network error"))
      
      const result = await waitForNetworkConnectivity(1000)
      
      expect(result).toBe(false)
    })
  })

  describe("retryWithBackoff", () => {
    it("should succeed on first attempt", async () => {
      const mockFn = jest.fn().mockResolvedValue("success")
      
      const result = await retryWithBackoff(mockFn)
      
      expect(result).toBe("success")
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it("should retry and succeed on second attempt", async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce("success")
      
      const result = await retryWithBackoff(mockFn, 2)
      
      expect(result).toBe("success")
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it("should throw error after all retries fail", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Persistent failure"))
      
      await expect(retryWithBackoff(mockFn, 2)).rejects.toThrow("Persistent failure")
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })
}) 