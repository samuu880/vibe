package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"
	"vibe-backend/pkg/cache"
	"vibe-backend/pkg/middleware"
	"vibe-backend/pkg/moderation"
	"vibe-backend/pkg/models"
)

type VibeStore struct {
	mu         sync.RWMutex
	vibes      map[string]*models.Vibe
	comments   map[string][]*models.Comment
	cache      *cache.MemoryCache
	moderation *moderation.ModerationEngine
	userStore  *UserStore
}

func NewVibeStore(c *cache.MemoryCache, mod *moderation.ModerationEngine, us *UserStore) *VibeStore {
	store := &VibeStore{
		vibes:      make(map[string]*models.Vibe),
		comments:   make(map[string][]*models.Comment),
		cache:      c,
		moderation: mod,
		userStore:  us,
	}

	// Seed with authentic initial vibe drops
	v1 := &models.Vibe{
		ID:            "vibe_bereal_1",
		UserID:        "usr_admin",
		Username:      "vibe_founder",
		UserAvatar:    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
		UserAuraTier:  "god tier",
		Type:          models.VibeTypeBeReal,
		FrontImageURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
		BackImageURL:  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
		Caption:       "late night deploy of the new audio engine 🎧 vibes are immaculate",
		Tags:          []string{"code", "vibes", "bereal"},
		AuraEarned:    500,
		LikesCount:    184,
		CommentsCount: 23,
		IsOnTime:      true,
		ModerationFlag: "clean",
		CreatedAt:     time.Now().Add(-12 * time.Minute),
	}
	store.vibes[v1.ID] = v1

	v2 := &models.Vibe{
		ID:            "vibe_audio_1",
		UserID:        "usr_sofia",
		Username:      "sofiap",
		UserAvatar:    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
		UserAuraTier:  "main character",
		Type:          models.VibeTypeAudio,
		AudioURL:      "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
		AudioDuration: 8.4,
		AudioWaveform: []float32{0.2, 0.4, 0.8, 0.6, 0.9, 0.5, 0.3, 0.7, 0.4, 0.6},
		Caption:       "listening to rain on the window while reading manga 🌧️",
		Tags:          []string{"lofi", "rain", "cozy"},
		AuraEarned:    250,
		LikesCount:    92,
		CommentsCount: 8,
		IsOnTime:      false,
		ModerationFlag: "clean",
		CreatedAt:     time.Now().Add(-45 * time.Minute),
	}
	store.vibes[v2.ID] = v2

	return store
}

// GetFeedHandler returns the vibes feed, using high performance in-memory caching
func (s *VibeStore) GetFeedHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	cacheKey := "feed_public"
	if cached, found := s.cache.Get(cacheKey); found {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		w.Write(cached.([]byte))
		return
	}

	s.mu.RLock()
	feedList := make([]*models.Vibe, 0, len(s.vibes))
	for _, v := range s.vibes {
		if v.ModerationFlag != "blocked" {
			feedList = append(feedList, v)
		}
	}
	s.mu.RUnlock()

	// Sort chronologically descending
	sort.Slice(feedList, func(i, j int) bool {
		return feedList[i].CreatedAt.After(feedList[j].CreatedAt)
	})

	data, _ := json.Marshal(map[string]interface{}{
		"status": "success",
		"count":  len(feedList),
		"vibes":  feedList,
	})

	// Cache for 10 seconds for ultra-high throughput
	s.cache.Set(cacheKey, data, 10*time.Second)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	w.Write(data)
}

// CreateVibeHandler creates a post or BeReal drop, running AI moderation before publishing
func (s *VibeStore) CreateVibeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.Vibe
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "malformed vibe payload"})
		return
	}

	// 1. AI Content Moderation Verification (NLP text analysis)
	modResult := s.moderation.InspectText(req.UserID, req.Caption)
	if modResult.IsBlocked {
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":       "vibe blocked by automated AI safety filter.",
			"reason":      modResult.Explanation,
			"category":    modResult.Category,
			"confidence":  modResult.Confidence,
			"blocked":     true,
		})
		return
	}

	// 2. Media Security and Safety Inspection
	if req.FrontImageURL != "" {
		if mRes := s.moderation.InspectMedia(req.UserID, req.FrontImageURL); mRes.IsBlocked {
			w.WriteHeader(http.StatusUnprocessableEntity)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": mRes.Explanation, "blocked": true})
			return
		}
	}
	if req.MediaURL != "" {
		if mRes := s.moderation.InspectMedia(req.UserID, req.MediaURL); mRes.IsBlocked {
			w.WriteHeader(http.StatusUnprocessableEntity)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": mRes.Explanation, "blocked": true})
			return
		}
	}

	// Sanitize text inputs
	req.Caption = middleware.SanitizeInput(req.Caption)
	req.ID = fmt.Sprintf("vibe_%d", time.Now().UnixNano())
	req.CreatedAt = time.Now()

	// Gamification aura allocation
	earnedAura := int64(100)
	if req.Type == models.VibeTypeBeReal {
		if req.IsOnTime {
			earnedAura = 500 // On-time drop bonus!
		} else {
			earnedAura = 150
		}
	} else if req.Type == models.VibeTypeAudio {
		earnedAura = 200
	}
	req.AuraEarned = earnedAura

	if modResult.IsFlagged {
		req.ModerationFlag = "flagged"
	} else {
		req.ModerationFlag = "clean"
	}

	s.mu.Lock()
	s.vibes[req.ID] = &req
	s.mu.Unlock()

	// Invalidate feed cache immediately
	s.cache.Delete("feed_public")

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "published",
		"vibe":        req,
		"aura_gained": earnedAura,
	})
}

// LikeVibeHandler handles double-tap likes and awards creator aura
func (s *VibeStore) LikeVibeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	vibeID := strings.TrimPrefix(r.URL.Path, "/api/vibes/like/")
	s.mu.Lock()
	v, exists := s.vibes[vibeID]
	if !exists {
		s.mu.Unlock()
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "vibe not found"})
		return
	}

	v.LikesCount++
	v.LikedByMe = true
	s.mu.Unlock()

	s.cache.Delete("feed_public")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "liked",
		"likes_count": v.LikesCount,
		"aura_bonus":  10,
	})
}
