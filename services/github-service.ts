export interface User {
  login: string
  name: string
  avatar_url: string
  html_url: string
  followers: number
  following: number
  public_repos: number
  created_at: string
  location?: string
  company?: string
  blog?: string
  bio?: string
  total_stars: number
  starred_at?: string
}

export interface StreamProgress {
  type: "progress" | "complete" | "error"
  message: string
  total?: number
  processed?: number
  users?: User[]
}

export class GitHubService {
  private token: string
  private abortController: AbortController | null = null

  constructor(token: string) {
    this.token = token
  }

  private getHeaders(): HeadersInit {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `token ${this.token}`,
      "User-Agent": "GitHub-Stargazers-Analyzer",
    }
  }

  public cancelRequests() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  public async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    const { timeout = 8000, ...fetchOptions } = options as any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.abortController = new AbortController()
        const timeoutId = setTimeout(() => this.abortController.abort(), timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          headers: this.getHeaders(),
          signal: this.abortController.signal,
        })

        clearTimeout(timeoutId)
        return response
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("Request aborted")
        }

        if (attempt === maxRetries) {
          throw error
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw new Error("Max retries exceeded")
  }

  public async getStargazers(
    owner: string,
    repo: string,
    maxUsers = 100,
    onProgress?: (progress: StreamProgress) => void,
  ): Promise<User[]> {
    try {
      // First, get all stargazers with retry mechanism
      const stargazers = await this.getStargazersWithRetry(owner, repo, maxUsers, onProgress)

      if (stargazers.length === 0) {
        if (onProgress) {
          onProgress({
            type: "error",
            message: "No stargazers found for this repository",
          })
        }
        return []
      }

      // Send initial progress
      if (onProgress) {
        onProgress({
          type: "progress",
          message: `Found ${stargazers.length} stargazers, starting detailed analysis...`,
          total: stargazers.length,
          processed: 0,
        })
      }

      // Process users with comprehensive error handling
      const users = await this.processUsersWithRetry(stargazers, onProgress)

      // Send final result
      if (onProgress) {
        onProgress({
          type: "complete",
          message: `Analysis complete! Successfully processed ${users.length} users out of ${stargazers.length} stargazers.`,
          users: users,
          total: users.length,
        })
      }

      return users
    } catch (error) {
      if (onProgress) {
        onProgress({
          type: "error",
          message: error instanceof Error ? error.message : "An unexpected error occurred",
        })
      }
      return []
    }
  }

  private async getStargazersWithRetry(
    owner: string,
    repo: string,
    maxUsers: number,
    onProgress?: (progress: StreamProgress) => void,
  ): Promise<any[]> {
    const users = []
    let page = 1
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 5

    while (users.length < maxUsers) {
      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/stargazers?page=${page}&per_page=100`
        const response = await this.fetchWithRetry(url, { timeout: 10000 }, 3)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Repository not found")
          }
          if (response.status === 403) {
            const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining")
            const rateLimitReset = response.headers.get("X-RateLimit-Reset")

            if (rateLimitRemaining === "0") {
              const resetTime = rateLimitReset ? new Date(Number.parseInt(rateLimitReset) * 1000) : new Date()
              const waitTime = Math.max(0, resetTime.getTime() - Date.now())

              if (onProgress) {
                onProgress({
                  type: "progress",
                  message: `Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`,
                  total: maxUsers,
                  processed: users.length,
                })
              }

              await new Promise((resolve) => setTimeout(resolve, waitTime + 1000))
              continue
            }
          }
          throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`)
        }

        const data = await response.json()
        if (!data || data.length === 0) {
          // No more stargazers available
          break
        }

        users.push(...data)
        consecutiveErrors = 0 // Reset error counter on success

        // Send progress update
        if (onProgress) {
          onProgress({
            type: "progress",
            message: `Fetched ${users.length} stargazers (page ${page})...`,
            total: maxUsers,
            processed: Math.min(users.length, maxUsers),
          })
        }

        page++

        if (users.length >= maxUsers) {
          users.splice(maxUsers)
          break
        }

        // Add small delay to be respectful to the API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        consecutiveErrors++

        if (onProgress) {
          onProgress({
            type: "progress",
            message: `Error fetching page ${page}: ${error instanceof Error ? error.message : "Unknown error"}. Retrying... (${consecutiveErrors}/${maxConsecutiveErrors})`,
            total: maxUsers,
            processed: users.length,
          })
        }

        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`Failed to fetch stargazers after ${maxConsecutiveErrors} consecutive errors`)
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, consecutiveErrors - 1), 10000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    return users
  }

  private async processUsersWithRetry(
    stargazers: any[],
    onProgress?: (progress: StreamProgress) => void,
  ): Promise<User[]> {
    const batchSize = 5
    const results = []
    let processedCount = 0

    for (let i = 0; i < stargazers.length; i += batchSize) {
      const batch = stargazers.slice(i, i + batchSize)
      let batchRetries = 0
      const maxBatchRetries = 3

      while (batchRetries < maxBatchRetries) {
        try {
          const batchResults = await this.processBatchWithRetry(batch)
          results.push(...batchResults)
          processedCount += batch.length

          // Send progress update with successful results
          if (onProgress) {
            onProgress({
              type: "progress",
              message: `Processed ${processedCount} of ${stargazers.length} users`,
              total: stargazers.length,
              processed: processedCount,
              users: batchResults,
            })
          }

          break // Success, move to next batch
        } catch (error) {
          batchRetries++

          if (onProgress) {
            onProgress({
              type: "progress",
              message: `Error processing batch ${i + 1}-${i + batch.length}: ${error instanceof Error ? error.message : "Unknown error"}. Retrying... (${batchRetries}/${maxBatchRetries})`,
              total: stargazers.length,
              processed: processedCount,
            })
          }

          if (batchRetries >= maxBatchRetries) {
            // Skip this batch and continue with the next one
            if (onProgress) {
              onProgress({
                type: "progress",
                message: `Skipping batch ${i + 1}-${i + batch.length} after ${maxBatchRetries} failed attempts`,
                total: stargazers.length,
                processed: processedCount,
              })
            }
            processedCount += batch.length // Count as processed even if failed
            break
          }

          // Exponential backoff for batch retry
          const delay = Math.min(1000 * Math.pow(2, batchRetries - 1), 5000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < stargazers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  private async processBatchWithRetry(stargazers: any[]): Promise<User[]> {
    const userPromises = stargazers.map(async (user) => {
      let retries = 0
      const maxRetries = 3

      while (retries < maxRetries) {
        try {
          // Get user details with timeout and retry
          const userResponse = await this.fetchWithRetry(
            `https://api.github.com/users/${user.login}`,
            { timeout: 10000 },
            2,
          )

          if (!userResponse.ok) {
            if (userResponse.status === 404) {
              // User not found, return null
              return null
            }
            throw new Error(`User API error: ${userResponse.status}`)
          }

          const userData = await userResponse.json()

          // Get user's total stars with retry
          const totalStars = await this.getUserTotalStarsWithRetry(user.login)

          return {
            login: userData.login,
            name: userData.name || userData.login,
            avatar_url: userData.avatar_url,
            html_url: userData.html_url,
            followers: userData.followers || 0,
            following: userData.following || 0,
            public_repos: userData.public_repos || 0,
            created_at: userData.created_at,
            location: userData.location,
            company: userData.company,
            blog: userData.blog,
            bio: userData.bio,
            total_stars: totalStars,
            starred_at: user.starred_at,
          }
        } catch (error) {
          retries++
          if (retries >= maxRetries) {
            console.error(`Failed to fetch user ${user.login} after ${maxRetries} retries:`, error)
            return null
          }

          // Exponential backoff
          const delay = Math.min(500 * Math.pow(2, retries - 1), 3000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      return null
    })

    const results = await Promise.all(userPromises)
    return results.filter((user): user is User => user !== null)
  }

  private async getUserTotalStarsWithRetry(username: string): Promise<number> {
    try {
      let totalStars = 0
      let page = 1
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 2

      while (page <= 3 && consecutiveErrors < maxConsecutiveErrors) {
        try {
          const url = `https://api.github.com/users/${username}/repos?page=${page}&per_page=100&sort=updated`
          const response = await this.fetchWithRetry(url, { timeout: 5000 }, 2)

          if (!response.ok) {
            if (response.status === 404) {
              // User or repos not found
              break
            }
            throw new Error(`Repos API error: ${response.status}`)
          }

          const repos = await response.json()
          if (!repos || repos.length === 0) break

          for (const repo of repos) {
            totalStars += repo.stargazers_count || 0
          }

          consecutiveErrors = 0 // Reset on success
          page++
        } catch (error) {
          consecutiveErrors++
          if (consecutiveErrors >= maxConsecutiveErrors) {
            break
          }
          // Small delay before retry
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      return totalStars
    } catch (error) {
      return 0
    }
  }
}
