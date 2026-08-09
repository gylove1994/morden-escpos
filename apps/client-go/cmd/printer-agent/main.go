// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

// Command printer-agent runs the Go Printer Agent against a print-queue control plane.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gylove1994/morden-node-escpos/apps/client-go/internal/agent"
	"github.com/gylove1994/morden-node-escpos/apps/client-go/internal/config"
	"github.com/gylove1994/morden-node-escpos/apps/client-go/internal/protocol"
)

func main() {
	configPath := flag.String("config", "", "optional JSON config path (serverUrl, deviceToken)")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "printer agent startup check failed: %v\n", err)
		os.Exit(1)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: parseLogLevel(cfg.LogLevel),
	}))

	client := protocol.NewClient(cfg.ServerURL, cfg.DeviceToken, nil)
	runner := &agent.Runner{
		Protocol:         client,
		Printer:          agent.LocalPrinter{},
		Logger:           logger,
		PollInterval:     time.Duration(cfg.PollIntervalMS) * time.Millisecond,
		IdleBackoff:      time.Duration(cfg.IdleBackoffMS) * time.Millisecond,
		IdleBackoffMax:   time.Duration(cfg.IdleBackoffMaxMS) * time.Millisecond,
		HeartbeatOnStart: true,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	logger.Info("starting printer agent", "serverUrl", cfg.ServerURL)
	if err := runner.Run(ctx); err != nil && !errors.Is(err, context.Canceled) && !errors.Is(err, context.DeadlineExceeded) {
		logger.Error("printer agent stopped", "error", err)
		os.Exit(1)
	}
	logger.Info("printer agent stopped")
}

func parseLogLevel(level string) slog.Level {
	switch level {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
