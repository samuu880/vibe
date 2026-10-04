package middleware

import (
	"testing"
	"time"
)

func TestValidateAge14Plus(t *testing.T) {
	now := time.Now().UTC()

	// 1. Underage user (13 years old) -> must be rejected
	underageDate := now.AddDate(-13, 0, 0).Format("2006-01-02")
	valid, age, err := ValidateAge14Plus(underageDate)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if valid {
		t.Errorf("expected 13 y/o to be invalid, got valid=true (age=%d)", age)
	}

	// 2. Exactly 14 years old -> must be valid
	exact14Date := now.AddDate(-14, 0, -1).Format("2006-01-02")
	valid, age, err = ValidateAge14Plus(exact14Date)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !valid || age < 14 {
		t.Errorf("expected 14 y/o to be valid, got valid=%v (age=%d)", valid, age)
	}

	// 3. Adult user (20 years old) -> must be valid
	adultDate := now.AddDate(-20, 0, 0).Format("2006-01-02")
	valid, age, err = ValidateAge14Plus(adultDate)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !valid || age < 20 {
		t.Errorf("expected 20 y/o to be valid, got valid=%v (age=%d)", valid, age)
	}

	// 4. Invalid date string format -> must error
	_, _, err = ValidateAge14Plus("invalid-date-format")
	if err == nil {
		t.Errorf("expected error for malformed date, got nil")
	}
}
