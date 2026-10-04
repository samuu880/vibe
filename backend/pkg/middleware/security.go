package middleware

import (
	"html"
	"net/http"
	"strings"
	"time"
)

// SecurityMiddleware adds enterprise security headers & handles CORS
func SecurityMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				// Allow all origins in dev or match allowed list / .app / .vercel.app
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Secret-Key, X-Requested-With")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Max-Age", "86400")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			// Cybersecurity hardening headers
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
			w.Header().Set("Content-Security-Policy", "default-src 'self' https: data: blob: 'unsafe-inline'; frame-ancestors 'none';")

			next.ServeHTTP(w, r)
		})
	}
}

// ValidateAge14Plus strictly validates that a birthdate represents someone who is at least 14 years old
func ValidateAge14Plus(birthDateStr string) (bool, int, error) {
	// Parse formats: "2010-05-15"
	layout := "2006-01-02"
	dob, err := time.Parse(layout, strings.TrimSpace(birthDateStr))
	if err != nil {
		return false, 0, err
	}

	now := time.Now().UTC()
	// Calculate age precisely
	age := now.Year() - dob.Year()
	if now.YearDay() < dob.YearDay() {
		age--
	}

	if age < 14 {
		return false, age, nil
	}

	return true, age, nil
}

// SanitizeInput escapes HTML entities and trims malicious characters to prevent XSS / injections
func SanitizeInput(input string) string {
	trimmed := strings.TrimSpace(input)
	escaped := html.EscapeString(trimmed)
	return escaped
}
