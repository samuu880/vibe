package cache

import (
	"sync"
	"time"
)

type cacheItem struct {
	value      interface{}
	expiresAt  time.Time
	lastAccess time.Time
}

// MemoryCache is a high-throughput, concurrent-safe in-memory caching system with TTL and auto-eviction
type MemoryCache struct {
	mu       sync.RWMutex
	items    map[string]*cacheItem
	maxItems int
	hits     int64
	misses   int64
}

// NewMemoryCache instantiates a high performance cache
func NewMemoryCache(maxItems int) *MemoryCache {
	c := &MemoryCache{
		items:    make(map[string]*cacheItem),
		maxItems: maxItems,
	}

	// Background eviction ticker to reclaim memory automatically
	go c.janitor(1 * time.Minute)

	return c
}

// Set stores a key-value pair with TTL
func (c *MemoryCache) Set(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// LRU check if exceeding maxItems
	if len(c.items) >= c.maxItems {
		var oldestKey string
		var oldestAccess time.Time = time.Now()
		for k, v := range c.items {
			if v.lastAccess.Before(oldestAccess) {
				oldestAccess = v.lastAccess
				oldestKey = k
			}
		}
		if oldestKey != "" {
			delete(c.items, oldestKey)
		}
	}

	c.items[key] = &cacheItem{
		value:      value,
		expiresAt:  time.Now().Add(ttl),
		lastAccess: time.Now(),
	}
}

// Get retrieves a key from cache, returning false if expired or missing
func (c *MemoryCache) Get(key string) (interface{}, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	item, exists := c.items[key]
	if !exists {
		c.misses++
		return nil, false
	}

	if time.Now().After(item.expiresAt) {
		delete(c.items, key)
		c.misses++
		return nil, false
	}

	item.lastAccess = time.Now()
	c.hits++
	return item.value, true
}

// Delete invalidates a key
func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

// Stats returns hit ratio and current item count
func (c *MemoryCache) Stats() map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()

	total := c.hits + c.misses
	ratio := 0.0
	if total > 0 {
		ratio = float64(c.hits) / float64(total) * 100.0
	}

	return map[string]interface{}{
		"active_keys": len(c.items),
		"hits":        c.hits,
		"misses":      c.misses,
		"hit_ratio":   ratio,
	}
}

// Janitor periodically purges expired keys to prevent memory leaks
func (c *MemoryCache) janitor(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, v := range c.items {
			if now.After(v.expiresAt) {
				delete(c.items, k)
			}
		}
		c.mu.Unlock()
	}
}
