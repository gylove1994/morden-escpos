// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

// Package config loads and validates Go Printer Agent startup configuration.
package config

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
)

const prefix = "APP_"

// Config is the validated Printer Agent runtime configuration.
type Config struct {
	ServerURL        string
	DeviceToken      string
	LogLevel         string
	PollIntervalMS   int
	IdleBackoffMS    int
	IdleBackoffMaxMS int
	NodeEnv          string
}

type fileConfig struct {
	ServerURL   string `json:"serverUrl"`
	DeviceToken string `json:"deviceToken"`
}

// Load reads env (and optional JSON config file), validates, and returns Config.
// In development (NODE_ENV=development), only APP_-prefixed variables are used
// (prefix stripped). In other environments, unprefixed keys are used.
// File values fill gaps; env wins over file for the same key.
func Load(configPath string) (Config, error) {
	env := envForParse()
	file, err := loadFile(configPath)
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		ServerURL:        firstNonEmpty(env["SERVER_URL"], file.ServerURL),
		DeviceToken:      firstNonEmpty(env["DEVICE_TOKEN"], file.DeviceToken),
		LogLevel:         firstNonEmpty(env["LOG_LEVEL"], "info"),
		PollIntervalMS:   1000,
		IdleBackoffMS:    1000,
		IdleBackoffMaxMS: 30000,
		NodeEnv:          firstNonEmpty(env["NODE_ENV"], "development"),
	}

	if v := env["POLL_INTERVAL_MS"]; v != "" {
		n, parseErr := strconv.Atoi(v)
		if parseErr != nil {
			return Config{}, fmt.Errorf("POLL_INTERVAL_MS: %w", parseErr)
		}
		cfg.PollIntervalMS = n
	}
	if v := env["IDLE_BACKOFF_MS"]; v != "" {
		n, parseErr := strconv.Atoi(v)
		if parseErr != nil {
			return Config{}, fmt.Errorf("IDLE_BACKOFF_MS: %w", parseErr)
		}
		cfg.IdleBackoffMS = n
	}
	if v := env["IDLE_BACKOFF_MAX_MS"]; v != "" {
		n, parseErr := strconv.Atoi(v)
		if parseErr != nil {
			return Config{}, fmt.Errorf("IDLE_BACKOFF_MAX_MS: %w", parseErr)
		}
		cfg.IdleBackoffMaxMS = n
	}

	if err := cfg.validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func (c Config) validate() error {
	if c.ServerURL == "" {
		return fmt.Errorf("SERVER_URL is required")
	}
	u, err := url.Parse(c.ServerURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return fmt.Errorf("SERVER_URL must be an absolute http(s) URL")
	}
	if strings.TrimSpace(c.DeviceToken) == "" {
		return fmt.Errorf("DEVICE_TOKEN is required")
	}
	switch c.LogLevel {
	case "debug", "info", "warn", "error":
	default:
		return fmt.Errorf("LOG_LEVEL must be one of debug|info|warn|error")
	}
	if c.PollIntervalMS < 100 || c.PollIntervalMS > 600_000 {
		return fmt.Errorf("POLL_INTERVAL_MS must be between 100 and 600000")
	}
	if c.IdleBackoffMS < 100 || c.IdleBackoffMS > 600_000 {
		return fmt.Errorf("IDLE_BACKOFF_MS must be between 100 and 600000")
	}
	if c.IdleBackoffMaxMS < c.IdleBackoffMS || c.IdleBackoffMaxMS > 600_000 {
		return fmt.Errorf("IDLE_BACKOFF_MAX_MS must be between IDLE_BACKOFF_MS and 600000")
	}
	return nil
}

func envForParse() map[string]string {
	nodeEnv := os.Getenv("NODE_ENV")
	appNodeEnv := os.Getenv(prefix + "NODE_ENV")
	isDev := nodeEnv == "development" || (nodeEnv == "" && (appNodeEnv == "development" || appNodeEnv == ""))

	out := map[string]string{}
	if isDev {
		for _, entry := range os.Environ() {
			key, value, ok := strings.Cut(entry, "=")
			if !ok || !strings.HasPrefix(key, prefix) {
				continue
			}
			out[strings.TrimPrefix(key, prefix)] = value
		}
		if _, ok := out["NODE_ENV"]; !ok && nodeEnv != "" {
			out["NODE_ENV"] = nodeEnv
		}
		return out
	}

	for _, entry := range os.Environ() {
		key, value, ok := strings.Cut(entry, "=")
		if !ok {
			continue
		}
		out[key] = value
	}
	return out
}

func loadFile(path string) (fileConfig, error) {
	if path == "" {
		path = os.Getenv("CONFIG_PATH")
	}
	if path == "" {
		path = os.Getenv(prefix + "CONFIG_PATH")
	}
	if path == "" {
		return fileConfig{}, nil
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return fileConfig{}, fmt.Errorf("read config file: %w", err)
	}
	var fc fileConfig
	if err := json.Unmarshal(raw, &fc); err != nil {
		return fileConfig{}, fmt.Errorf("parse config file: %w", err)
	}
	return fc, nil
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}
