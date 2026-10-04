package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
	"vibe-backend/pkg/middleware"
	"vibe-backend/pkg/models"
)

type MessageStore struct {
	mu       sync.RWMutex
	messages []*models.Message
}

func NewMessageStore() *MessageStore {
	store := &MessageStore{
		messages: make([]*models.Message, 0),
	}

	// Seed with an initial sample DM conversation
	store.messages = append(store.messages, &models.Message{
		ID:            "msg_1",
		SenderID:      "usr_sofia",
		ReceiverID:    "usr_admin",
		Content:       "yo! did you see the new vibe drop?",
		IsEphemeral:   false,
		IsRead:        true,
		CreatedAt:     time.Now().Add(-10 * time.Minute),
	})
	store.messages = append(store.messages, &models.Message{
		ID:            "msg_2",
		SenderID:      "usr_admin",
		ReceiverID:    "usr_sofia",
		Content:       "listening to your rain voice note right now, pure aesthetic 🌧️",
		IsEphemeral:   false,
		IsRead:        true,
		CreatedAt:     time.Now().Add(-8 * time.Minute),
	})

	return store
}

func (s *MessageStore) GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.messages)
}

func (s *MessageStore) SendMessageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.Message
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid message payload"})
		return
	}

	req.ID = fmt.Sprintf("msg_%d", time.Now().UnixNano())
	req.Content = middleware.SanitizeInput(req.Content)
	req.CreatedAt = time.Now()
	req.IsRead = false

	s.mu.Lock()
	s.messages = append(s.messages, &req)
	s.mu.Unlock()

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}
