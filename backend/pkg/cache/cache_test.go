package cache

import (
	"testing"
	"time"
)

func TestMemoryCacheOperations(t *testing.T) {
	c := NewMemoryCache(10)

	// Set and Get
	c.Set("feed_key", "active_feed_data", 500*time.Millisecond)

	val, found := c.Get("feed_key")
	if !found || val.(string) != "active_feed_data" {
		t.Fatalf("expected active_feed_data, got %v (found=%v)", val, found)
	}

	// Stats check
	stats := c.Stats()
	if stats["hits"].(int64) != 1 {
		t.Errorf("expected 1 hit, got %v", stats["hits"])
	}

	// Expiration check
	time.Sleep(600 * time.Millisecond)
	_, foundAfterExpiry := c.Get("feed_key")
	if foundAfterExpiry {
		t.Errorf("expected key to be expired, but was found")
	}
}
