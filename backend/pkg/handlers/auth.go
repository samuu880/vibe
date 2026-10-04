package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
	"vibe-backend/pkg/middleware"
	"vibe-backend/pkg/models"
)

type RegisterRequest struct {
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	BirthDate string `json:"birth_date"` // YYYY-MM-DD
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

type UserStore struct {
	mu    sync.RWMutex
	users map[string]*models.User
}

func NewUserStore() *UserStore {
	store := &UserStore{
		users: make(map[string]*models.User),
	}

	// Seed with default demo / admin accounts
	adminHash := hashPassword("vibeAdmin2026!")
	admin := &models.User{
		ID:           "usr_admin",
		Username:     "vibe_founder",
		Email:        "founder@vibe.app",
		PasswordHash: adminHash,
		BirthDate:    "2000-01-01",
		Age:          26,
		Aura:         99999,
		AuraTier:     "god tier",
		AvatarURL:    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
		Bio:          "building the future of social vibe ✨",
		IsAdmin:      true,
		IsBanned:     false,
		StreakDays:   42,
		LastActive:   time.Now(),
		CreatedAt:    time.Now().Add(-180 * 24 * time.Hour),
	}
	store.users[admin.Username] = admin

	// Seed regular user
	user1Hash := hashPassword("password123")
	user1 := &models.User{
		ID:           "usr_sofia",
		Username:     "sofiap",
		Email:        "sofia@vibe.app",
		PasswordHash: user1Hash,
		BirthDate:    "2006-07-14",
		Age:          20,
		Aura:         14200,
		AuraTier:     "main character",
		AvatarURL:    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
		Bio:          "coffee, matcha, aesthetic drops ☕️",
		IsAdmin:      false,
		IsBanned:     false,
		StreakDays:   14,
		LastActive:   time.Now(),
		CreatedAt:    time.Now().Add(-30 * 24 * time.Hour),
	}
	store.users[user1.Username] = user1

	return store
}

func hashPassword(p string) string {
	h := sha256.Sum256([]byte(p + "_vibe_salt_2026"))
	return hex.EncodeToString(h[:])
}

// RegisterHandler enforces strict 14+ age verification and creates user
func (s *UserStore) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "malformed registration data"})
		return
	}

	req.Username = strings.ToLower(middleware.SanitizeInput(req.Username))
	req.Email = strings.ToLower(middleware.SanitizeInput(req.Email))

	if len(req.Username) < 3 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "username must be at least 3 characters"})
		return
	}
	if len(req.Password) < 8 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "password must be at least 8 characters"})
		return
	}

	// STRICT 14+ AGE VERIFICATION (LEGAL REQUIREMENT)
	isValidAge, age, err := middleware.ValidateAge14Plus(req.BirthDate)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "invalid birth date format. use YYYY-MM-DD",
		})
		return
	}

	if !isValidAge {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":     "you must be at least 14 years old to join vibe.",
			"code":      "UNDERAGE_FORBIDDEN",
			"legal_ref": "COPPA / GDPR Article 8 compliance",
			"your_age":  age,
		})
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.users[req.Username]; exists {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "username already taken"})
		return
	}

	id := fmt.Sprintf("usr_%d", time.Now().UnixNano())
	newUser := &models.User{
		ID:           id,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashPassword(req.Password),
		BirthDate:    req.BirthDate,
		Age:          age,
		Aura:         1000, // Starting aura for new members
		AuraTier:     "rising",
		AvatarURL:    fmt.Sprintf("https://api.dicebear.com/7.x/identicon/svg?seed=%s", req.Username),
		Bio:          "just joined vibe ✨",
		IsAdmin:      false,
		IsBanned:     false,
		StreakDays:   1,
		LastActive:   time.Now(),
		CreatedAt:    time.Now(),
	}

	s.users[req.Username] = newUser

	token := fmt.Sprintf("vibe_token_%s_%d", id, time.Now().Unix())

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  newUser,
	})
}

// LoginHandler verifies credentials
func (s *UserStore) LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "malformed login payload"})
		return
	}

	username := strings.ToLower(strings.TrimSpace(req.Username))
	s.mu.RLock()
	user, exists := s.users[username]
	s.mu.RUnlock()

	if !exists || user.PasswordHash != hashPassword(req.Password) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid username or password"})
		return
	}

	if user.IsBanned {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "this account has been banned due to safety policy violations."})
		return
	}

	token := fmt.Sprintf("vibe_token_%s_%d", user.ID, time.Now().Unix())
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  user,
	})
}

func (s *UserStore) GetAllUsers() []*models.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	list := make([]*models.User, 0, len(s.users))
	for _, u := range s.users {
		list = append(list, u)
	}
	return list
}
