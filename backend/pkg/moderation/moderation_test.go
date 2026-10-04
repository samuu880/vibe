package moderation

import (
	"testing"
)

func TestModerationEngine(t *testing.T) {
	engine := NewModerationEngine()

	// 1. Clean message should pass
	cleanRes := engine.InspectText("usr_1", "just dropping my sunset photo from the rooftop! 🌅")
	if cleanRes.IsBlocked || cleanRes.IsFlagged {
		t.Errorf("expected clean message to pass, got blocked=%v flagged=%v", cleanRes.IsBlocked, cleanRes.IsFlagged)
	}

	// 2. Severe hate speech / violence must be blocked
	severeRes := engine.InspectText("usr_2", "go kys right now")
	if !severeRes.IsBlocked || severeRes.Confidence < 0.90 {
		t.Errorf("expected severe violation to be blocked, got blocked=%v confidence=%f", severeRes.IsBlocked, severeRes.Confidence)
	}

	// 3. Doxxing / phone numbers must be blocked
	doxxRes := engine.InspectText("usr_3", "my phone number is 415-555-0199 call me")
	if !doxxRes.IsBlocked || doxxRes.Category != "doxxing_pii" {
		t.Errorf("expected doxxing to be blocked, got blocked=%v category=%s", doxxRes.IsBlocked, doxxRes.Category)
	}

	// 4. Audit logs must capture incidents
	logs := engine.GetAuditLogs()
	if len(logs) < 2 {
		t.Errorf("expected at least 2 audit logs recorded, got %d", len(logs))
	}
}
