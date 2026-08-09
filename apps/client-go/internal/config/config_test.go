// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package config_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/gylove1994/morden-node-escpos/apps/client-go/internal/config"
)

func TestLoadFromEnvDevelopmentPrefix(t *testing.T) {
	clearPrinterAgentEnv(t)
	t.Setenv("NODE_ENV", "development")
	t.Setenv("APP_SERVER_URL", "http://127.0.0.1:43128")
	t.Setenv("APP_DEVICE_TOKEN", "pat_dev_token")
	t.Setenv("SERVER_URL", "http://should-not-win.example")
	t.Setenv("DEVICE_TOKEN", "should-not-win")

	cfg, err := config.Load("")
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.ServerURL != "http://127.0.0.1:43128" {
		t.Fatalf("ServerURL=%q", cfg.ServerURL)
	}
	if cfg.DeviceToken != "pat_dev_token" {
		t.Fatalf("DeviceToken=%q", cfg.DeviceToken)
	}
}

func TestLoadFromEnvProduction(t *testing.T) {
	clearPrinterAgentEnv(t)
	t.Setenv("NODE_ENV", "production")
	t.Setenv("SERVER_URL", "https://queue.example.com")
	t.Setenv("DEVICE_TOKEN", "pat_prod_token")

	cfg, err := config.Load("")
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.ServerURL != "https://queue.example.com" {
		t.Fatalf("ServerURL=%q", cfg.ServerURL)
	}
	if cfg.DeviceToken != "pat_prod_token" {
		t.Fatalf("DeviceToken=%q", cfg.DeviceToken)
	}
}

func TestLoadFromConfigFile(t *testing.T) {
	clearPrinterAgentEnv(t)
	t.Setenv("NODE_ENV", "production")

	dir := t.TempDir()
	path := filepath.Join(dir, "printer-agent.json")
	content := `{"serverUrl":"http://127.0.0.1:43128","deviceToken":"pat_file_token"}`
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write: %v", err)
	}

	cfg, err := config.Load(path)
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.DeviceToken != "pat_file_token" {
		t.Fatalf("DeviceToken=%q", cfg.DeviceToken)
	}
}

func TestLoadRequiresServerURLAndToken(t *testing.T) {
	clearPrinterAgentEnv(t)
	t.Setenv("NODE_ENV", "production")
	_, err := config.Load("")
	if err == nil {
		t.Fatal("expected validation error")
	}
}

func clearPrinterAgentEnv(t *testing.T) {
	t.Helper()
	keys := []string{
		"NODE_ENV", "SERVER_URL", "DEVICE_TOKEN", "LOG_LEVEL",
		"POLL_INTERVAL_MS", "IDLE_BACKOFF_MS", "IDLE_BACKOFF_MAX_MS", "CONFIG_PATH",
		"APP_NODE_ENV", "APP_SERVER_URL", "APP_DEVICE_TOKEN", "APP_LOG_LEVEL",
		"APP_POLL_INTERVAL_MS", "APP_IDLE_BACKOFF_MS", "APP_IDLE_BACKOFF_MAX_MS", "APP_CONFIG_PATH",
	}
	for _, key := range keys {
		t.Setenv(key, "")
	}
}
