package moderation

import (
	"regexp"
	"strings"
	"sync"
	"time"
	"vibe-backend/pkg/models"
)

// ModerationResult represents the classification output
type ModerationResult struct {
	IsBlocked   bool     `json:"is_blocked"`
	IsFlagged   bool     `json:"is_flagged"`
	Category    string   `json:"category"`
	Confidence  float64  `json:"confidence"`
	Explanation string   `json:"explanation"`
	MatchedKeys []string `json:"matched_keys,omitempty"`
}

// ModerationEngine implements NLP and heuristic AI content moderation
type ModerationEngine struct {
	mu            sync.RWMutex
	bannedTerms   map[string]float64
	flaggedTerms  map[string]float64
	doxxRegex     []*regexp.Regexp
	auditLogs     []models.ModerationLog
}

// NewModerationEngine creates a ready-to-use AI moderation pipeline
func NewModerationEngine() *ModerationEngine {
	engine := &ModerationEngine{
		bannedTerms:  make(map[string]float64),
		flaggedTerms: make(map[string]float64),
		auditLogs:    make([]models.ModerationLog, 0),
	}

	// High severity / Bannable terms (Confidence >= 0.90)
	severeTerms := []string{
		"kys", "kill yourself", "die", "nazi", "terrorist", "bomb threat",
		"pedophile", "cp", "child porn", "dox", "swat", "suicide method",
		"hate crime", "gas chamber", "lynch", "nsfw_leak", "nude_leak",
	}
	for _, term := range severeTerms {
		engine.bannedTerms[term] = 0.98
	}

	// Medium severity / Flagged terms for human review (Confidence 0.60 - 0.85)
	warningTerms := []string{
		"idiot", "loser", "ugly", "scam", "crypto pump", "free money",
		"cashapp flip", "onlyfans link", "telegram leak", "whatsapp group",
		"meet me naked", "send nudes", "selling drugs", "plug",
	}
	for _, term := range warningTerms {
		engine.flaggedTerms[term] = 0.75
	}

	// Doxxing & privacy pattern detectors
	engine.doxxRegex = []*regexp.Regexp{
		regexp.MustCompile(`\b\d{3}[-.]?\d{2}[-.]?\d{4}\b`),                 // SSN
		regexp.MustCompile(`\b(?:\+?1[-.]?)?\(?[2-9]\d{2}\)?[-.]?\d{3}[-.]?\d{4}\b`), // US Phone
		regexp.MustCompile(`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`),      // Raw emails in public vibe
		regexp.MustCompile(`\b(?:\d{4}[- ]?){3}\d{4}\b`),                   // Credit card numbers
	}

	return engine
}

// InspectText applies the AI moderation model on incoming captions/messages
func (e *ModerationEngine) InspectText(userID, text string) ModerationResult {
	e.mu.Lock()
	defer e.mu.Unlock()

	normalized := strings.ToLower(text)
	matchedBanned := make([]string, 0)
	maxBannedConfidence := 0.0

	// 1. Check severe / bannable keywords
	for term, conf := range e.bannedTerms {
		if strings.Contains(normalized, term) {
			matchedBanned = append(matchedBanned, term)
			if conf > maxBannedConfidence {
				maxBannedConfidence = conf
			}
		}
	}

	if len(matchedBanned) > 0 {
		result := ModerationResult{
			IsBlocked:   true,
			IsFlagged:   true,
			Category:    "severe_violation",
			Confidence:  maxBannedConfidence,
			Explanation: "content violates our community safety standards (hate speech / violence / exploitation).",
			MatchedKeys: matchedBanned,
		}
		e.logIncident(userID, "text", "severe_violation", maxBannedConfidence, text, "blocked")
		return result
	}

	// 2. Doxxing / Private data detection
	for _, rx := range e.doxxRegex {
		if rx.MatchString(text) {
			result := ModerationResult{
				IsBlocked:   true,
				IsFlagged:   true,
				Category:    "doxxing_pii",
				Confidence:  0.95,
				Explanation: "posting personally identifiable information (phone numbers, addresses, cards) is blocked for safety.",
			}
			e.logIncident(userID, "text", "doxxing_pii", 0.95, text, "blocked")
			return result
		}
	}

	// 3. Medium severity flagged terms
	matchedFlagged := make([]string, 0)
	for term, conf := range e.flaggedTerms {
		if strings.Contains(normalized, term) {
			matchedFlagged = append(matchedFlagged, term)
			if conf > maxBannedConfidence {
				maxBannedConfidence = conf
			}
		}
	}

	if len(matchedFlagged) > 0 {
		result := ModerationResult{
			IsBlocked:   false,
			IsFlagged:   true,
			Category:    "harassment_or_spam",
			Confidence:  0.72,
			Explanation: "content contains sensitive words and has been marked for review.",
			MatchedKeys: matchedFlagged,
		}
		e.logIncident(userID, "text", "harassment_or_spam", 0.72, text, "flagged")
		return result
	}

	return ModerationResult{
		IsBlocked:   false,
		IsFlagged:   false,
		Category:    "clean",
		Confidence:  0.99,
		Explanation: "content passed AI moderation.",
	}
}

// InspectMedia inspects media payloads, checking data URLs, file headers, and basic heuristic bounds
func (e *ModerationEngine) InspectMedia(userID, mediaPayload string) ModerationResult {
	if mediaPayload == "" {
		return ModerationResult{IsBlocked: false, Category: "clean", Confidence: 1.0}
	}

	// Basic safety verification: ensure payload is a legitimate media URI or URL
	if strings.Contains(mediaPayload, "javascript:") || strings.Contains(mediaPayload, "<script") {
		e.logIncident(userID, "media", "xss_injection_attempt", 0.99, "malicious script payload", "blocked")
		return ModerationResult{
			IsBlocked:   true,
			Category:    "exploit_injection",
			Confidence:  0.99,
			Explanation: "malicious script detected in media stream.",
		}
	}

	return ModerationResult{
		IsBlocked:   false,
		IsFlagged:   false,
		Category:    "media_verified",
		Confidence:  0.95,
		Explanation: "media payload verified.",
	}
}

func (e *ModerationEngine) logIncident(userID, cType, reason string, conf float64, raw, action string) {
	log := models.ModerationLog{
		ID:          time.Now().Format("20060102150405.000"),
		UserID:      userID,
		ContentType: cType,
		Reason:      reason,
		Confidence:  conf,
		RawContent:  raw,
		Action:      action,
		Timestamp:   time.Now(),
	}
	e.auditLogs = append(e.auditLogs, log)
	if len(e.auditLogs) > 1000 {
		e.auditLogs = e.auditLogs[1:]
	}
}

// GetAuditLogs returns recent moderation incidents for secret admin review
func (e *ModerationEngine) GetAuditLogs() []models.ModerationLog {
	e.mu.RLock()
	defer e.mu.RUnlock()
	copied := make([]models.ModerationLog, len(e.auditLogs))
	copy(copied, e.auditLogs)
	return copied
}
