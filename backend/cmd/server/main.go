package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"vibe-backend/pkg/cache"
	"vibe-backend/pkg/handlers"
	"vibe-backend/pkg/middleware"
	"vibe-backend/pkg/moderation"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 1. Initialize High Performance Cache (10,000 slots)
	memCache := cache.NewMemoryCache(10000)

	// 2. Initialize AI Content Moderation Engine
	modEngine := moderation.NewModerationEngine()

	// 3. Initialize Stores
	userStore := handlers.NewUserStore()
	vibeStore := handlers.NewVibeStore(memCache, modEngine, userStore)
	msgStore := handlers.NewMessageStore()
	adminDashboard := handlers.NewAdminDashboard(memCache, modEngine, userStore, vibeStore)

	// 4. Rate Limiter (25 requests/sec, burst 50)
	rateLimiter := middleware.NewRateLimiter(25.0, 50.0)

	// 5. Router Setup
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"online","service":"vibe-core-engine","version":"1.0.0"}`))
	})

	// Auth routes (Strict 14+ verification)
	mux.HandleFunc("/api/auth/register", userStore.RegisterHandler)
	mux.HandleFunc("/api/auth/login", userStore.LoginHandler)

	// Feed & Vibe routes (AI moderated + cached)
	mux.HandleFunc("/api/vibes", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			vibeStore.GetFeedHandler(w, r)
		} else if r.Method == http.MethodPost {
			vibeStore.CreateVibeHandler(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/vibes/like/", vibeStore.LikeVibeHandler)

	// Direct Messages & Voice Notes
	mux.HandleFunc("/api/messages", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			msgStore.GetMessagesHandler(w, r)
		} else if r.Method == http.MethodPost {
			msgStore.SendMessageHandler(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Secret Admin Vault routes (Requires X-Admin-Secret-Key)
	mux.HandleFunc("/api/vault/stats", adminDashboard.StatsHandler)
	mux.HandleFunc("/api/vault/ban/", adminDashboard.BanUserHandler)

	// Wrap with Middleware Chain: Rate Limiting -> Security / CORS
	securityWrapper := middleware.SecurityMiddleware([]string{"*"})
	handlerChain := securityWrapper(rateLimiter.Middleware(mux))

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handlerChain,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown handling
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Printf("\n✨ vibe backend engine running on http://localhost:%s\n", port)
		fmt.Println("⚡ Cache initialized: 10,000 slots | LRU + TTL enabled")
		fmt.Println("🛡️ AI Moderation: Active (NLP + Heuristics + Anti-Doxx)")
		fmt.Println("🔒 Strict 14+ Age Verification: Enforced")
		fmt.Println("🗝️ Secret Admin Vault: /api/vault/* protected")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	<-stopChan
	fmt.Println("\nShutting down vibe backend gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	fmt.Println("vibe backend stopped.")
}
