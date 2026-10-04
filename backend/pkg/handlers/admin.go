package handlers

import (
	"encoding/json"
	"net/http"
	"runtime"
	"strings"
	"time"
	"vibe-backend/pkg/cache"
	"vibe-backend/pkg/moderation"
)

const SecretAdminToken = "vibe_vault_sec_994827"

type AdminDashboard struct {
	cache      *cache.MemoryCache
	moderation *moderation.ModerationEngine
	userStore  *UserStore
	vibeStore  *VibeStore
	startTime  time.Time
}

func NewAdminDashboard(c *cache.MemoryCache, m *moderation.ModerationEngine, u *UserStore, v *VibeStore) *AdminDashboard {
	return &AdminDashboard{
		cache:      c,
		moderation: m,
		userStore:  u,
		vibeStore:  v,
		startTime:  time.Now(),
	}
}

// AuthMiddleware verifies the secret vault key
func (a *AdminDashboard) verifyAdminAuth(r *http.Request) bool {
	key := r.Header.Get("X-Admin-Secret-Key")
	if key == SecretAdminToken {
		return true
	}
	auth := r.Header.Get("Authorization")
	return strings.HasSuffix(auth, SecretAdminToken)
}

// StatsHandler returns system telemetry, cache metrics, and moderation queue
func (a *AdminDashboard) StatsHandler(w http.ResponseWriter, r *http.Request) {
	if !a.verifyAdminAuth(r) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "access denied: secret admin key required"})
		return
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	allUsers := a.userStore.GetAllUsers()
	cacheStats := a.cache.Stats()
	auditLogs := a.moderation.GetAuditLogs()

	a.vibeStore.mu.RLock()
	totalVibes := len(a.vibeStore.vibes)
	flaggedCount := 0
	for _, v := range a.vibeStore.vibes {
		if v.ModerationFlag == "flagged" {
			flaggedCount++
		}
	}
	a.vibeStore.mu.RUnlock()

	response := map[string]interface{}{
		"system": map[string]interface{}{
			"status":            "operational",
			"uptime_seconds":    int(time.Since(a.startTime).Seconds()),
			"go_routines":       runtime.NumGoroutine(),
			"memory_alloc_mb":   float64(m.Alloc) / 1024 / 1024,
			"total_alloc_mb":    float64(m.TotalAlloc) / 1024 / 1024,
			"gc_cycles":         m.NumGC,
		},
		"cache": cacheStats,
		"community": map[string]interface{}{
			"total_users":    len(allUsers),
			"total_vibes":    totalVibes,
			"flagged_vibes":  flaggedCount,
		},
		"moderation_logs": auditLogs,
		"users":           allUsers,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// BanUserHandler applies the ban hammer
func (a *AdminDashboard) BanUserHandler(w http.ResponseWriter, r *http.Request) {
	if !a.verifyAdminAuth(r) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	username := strings.TrimPrefix(r.URL.Path, "/api/vault/ban/")
	a.userStore.mu.Lock()
	defer a.userStore.mu.Unlock()

	u, exists := a.userStore.users[username]
	if !exists {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "user not found"})
		return
	}

	u.IsBanned = !u.IsBanned // Toggle ban state
	json.NewEncoder(w).Encode(map[string]interface{}{
		"username":  username,
		"is_banned": u.IsBanned,
		"status":    "updated",
	})
}
