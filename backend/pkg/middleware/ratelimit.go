package middleware

import (
	"net/http"
	"sync"
	"time"
)

type clientLimit struct {
	tokens    float64
	lastCheck time.Time
}

// RateLimiter implements a token bucket rate limiter per IP address
type RateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*clientLimit
	rate     float64 // tokens per second
	capacity float64 // burst capacity
}

// NewRateLimiter creates a rate limiter (e.g. 20 requests per sec, burst 40)
func NewRateLimiter(rate, capacity float64) *RateLimiter {
	rl := &RateLimiter{
		clients:  make(map[string]*clientLimit),
		rate:     rate,
		capacity: capacity,
	}

	// Periodic cleanup of inactive IPs
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			rl.mu.Lock()
			now := time.Now()
			for ip, client := range rl.clients {
				if now.Sub(client.lastCheck) > 10*time.Minute {
					delete(rl.clients, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

// Middleware returns an http.Handler that enforces the rate limit
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			ip = xff
		}

		rl.mu.Lock()
		client, exists := rl.clients[ip]
		now := time.Now()

		if !exists {
			rl.clients[ip] = &clientLimit{
				tokens:    rl.capacity - 1,
				lastCheck: now,
			}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		// Calculate replenished tokens
		elapsed := now.Sub(client.lastCheck).Seconds()
		client.tokens += elapsed * rl.rate
		if client.tokens > rl.capacity {
			client.tokens = rl.capacity
		}
		client.lastCheck = now

		if client.tokens < 1.0 {
			rl.mu.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"chill out, too many requests. try again in a few seconds."}`))
			return
		}

		client.tokens -= 1.0
		rl.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}
