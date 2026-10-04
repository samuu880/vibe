package models

import (
	"time"
)

// User represents an authenticated platform user
type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	BirthDate    string    `json:"birth_date"` // YYYY-MM-DD
	Age          int       `json:"age"`
	Aura         int64     `json:"aura"`
	AuraTier     string    `json:"aura_tier"`
	AvatarURL    string    `json:"avatar_url"`
	Bio          string    `json:"bio"`
	IsAdmin      bool      `json:"is_admin"`
	IsBanned     bool      `json:"is_banned"`
	StreakDays   int       `json:"streak_days"`
	LastActive   time.Time `json:"last_active"`
	CreatedAt    time.Time `json:"created_at"`
}

// VibeType defines the category of vibe
type VibeType string

const (
	VibeTypeBeReal VibeType = "bereal"
	VibeTypePost   VibeType = "post"
	VibeTypeAudio  VibeType = "audio"
)

// Vibe represents a post or daily drop
type Vibe struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	Username       string    `json:"username"`
	UserAvatar     string    `json:"user_avatar"`
	UserAuraTier   string    `json:"user_aura_tier"`
	Type           VibeType  `json:"type"`
	FrontImageURL  string    `json:"front_image_url,omitempty"` // For BeReal dual cam (front selfie)
	BackImageURL   string    `json:"back_image_url,omitempty"`  // For BeReal dual cam (back environment)
	MediaURL       string    `json:"media_url,omitempty"`       // For single photo/video post
	AudioURL       string    `json:"audio_url,omitempty"`       // For voice note / audio post
	AudioDuration  float64   `json:"audio_duration,omitempty"`  // In seconds
	AudioWaveform  []float32 `json:"audio_waveform,omitempty"`  // Peak points for visualizer
	Caption        string    `json:"caption"`
	Tags           []string  `json:"tags"`
	AuraEarned     int64     `json:"aura_earned"`
	LikesCount     int       `json:"likes_count"`
	LikedByMe      bool      `json:"liked_by_me"`
	CommentsCount  int       `json:"comments_count"`
	IsOnTime       bool      `json:"is_on_time"` // BeReal on-time bonus
	LateMinutes    int       `json:"late_minutes,omitempty"`
	ModerationFlag string    `json:"moderation_flag"` // "clean", "flagged", "blocked"
	CreatedAt      time.Time `json:"created_at"`
}

// Comment on a vibe
type Comment struct {
	ID         string    `json:"id"`
	VibeID     string    `json:"vibe_id"`
	UserID     string    `json:"user_id"`
	Username   string    `json:"username"`
	UserAvatar string    `json:"user_avatar"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}

// Message represents a 1-on-1 direct message
type Message struct {
	ID            string    `json:"id"`
	SenderID      string    `json:"sender_id"`
	ReceiverID    string    `json:"receiver_id"`
	Content       string    `json:"content"`
	AudioURL      string    `json:"audio_url,omitempty"`
	AudioDuration float64   `json:"audio_duration,omitempty"`
	IsEphemeral   bool      `json:"is_ephemeral"`
	IsRead        bool      `json:"is_read"`
	CreatedAt     time.Time `json:"created_at"`
}

// ModerationLog tracks flagged or blocked content for legal and audit compliance
type ModerationLog struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	ContentType string   `json:"content_type"`
	Reason     string    `json:"reason"`
	Confidence float64   `json:"confidence"`
	RawContent string    `json:"raw_content"`
	Action     string    `json:"action"` // "blocked", "flagged", "approved"
	Timestamp  time.Time `json:"timestamp"`
}

// AuraTransaction records gamification point events
type AuraTransaction struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Amount    int64     `json:"amount"`
	Reason    string    `json:"reason"`
	Timestamp time.Time `json:"timestamp"`
}

// Helper to calculate Aura Tier
func CalculateAuraTier(aura int64) string {
	switch {
	case aura >= 50000:
		return "god tier"
	case aura >= 20000:
		return "certified vibe"
	case aura >= 5000:
		return "main character"
	case aura >= 1000:
		return "rising"
	default:
		return "npc"
	}
}
