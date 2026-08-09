// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

// Package agent implements the Go Printer Agent poll / lease / print / report loop.
package agent

import (
	"context"
	"encoding/base64"
	"fmt"
	"log/slog"
	"time"

	"github.com/gylove1994/morden-node-escpos/apps/client-go/driver"
	"github.com/gylove1994/morden-node-escpos/apps/client-go/internal/protocol"
)

// Printer prints raw ESC/POS bytes using connection hints from a leased job.
type Printer interface {
	PrintRawTCP(ctx context.Context, address string, port int, payload []byte) error
	PrintRawUSB(ctx context.Context, path string, payload []byte) error
	PrintRawSerial(ctx context.Context, path string, baudRate int, payload []byte) error
}

// LocalPrinter is the production Printer backed by driver transports.
type LocalPrinter struct{}

// PrintRawTCP implements Printer.
func (LocalPrinter) PrintRawTCP(ctx context.Context, address string, port int, payload []byte) error {
	return driver.PrintRawTCP(ctx, address, port, payload)
}

// PrintRawUSB implements Printer.
func (LocalPrinter) PrintRawUSB(ctx context.Context, path string, payload []byte) error {
	return driver.PrintRawUSB(ctx, path, payload)
}

// PrintRawSerial implements Printer.
func (LocalPrinter) PrintRawSerial(ctx context.Context, path string, baudRate int, payload []byte) error {
	return driver.PrintRawSerial(ctx, path, baudRate, payload)
}

// TCPPrinter is an alias for LocalPrinter kept for call-site compatibility.
type TCPPrinter = LocalPrinter

// Protocol is the Print Queue Agent Protocol surface used by the runner.
type Protocol interface {
	Heartbeat(ctx context.Context) (*protocol.HeartbeatResponse, error)
	Lease(ctx context.Context) (*protocol.LeasedJob, error)
	Report(ctx context.Context, jobID, status string, errorMessage string) (*protocol.JobPublic, error)
}

// Runner is the Printer Agent work loop.
type Runner struct {
	Protocol         Protocol
	Printer          Printer
	Logger           *slog.Logger
	PollInterval     time.Duration
	IdleBackoff      time.Duration
	IdleBackoffMax   time.Duration
	HeartbeatOnStart bool
}

// Run polls until ctx is cancelled.
func (r *Runner) Run(ctx context.Context) error {
	if r.Logger == nil {
		r.Logger = slog.Default()
	}
	if r.Printer == nil {
		r.Printer = LocalPrinter{}
	}
	if r.PollInterval <= 0 {
		r.PollInterval = time.Second
	}
	if r.IdleBackoff <= 0 {
		r.IdleBackoff = time.Second
	}
	if r.IdleBackoffMax < r.IdleBackoff {
		r.IdleBackoffMax = 30 * time.Second
	}

	if r.HeartbeatOnStart {
		hb, err := r.Protocol.Heartbeat(ctx)
		if err != nil {
			return fmt.Errorf("printer agent heartbeat: %w", err)
		}
		r.Logger.Info("printer agent authenticated",
			"printerAgentId", hb.PrinterAgentID,
			"organizationId", hb.OrganizationID,
		)
	}

	backoff := r.IdleBackoff
	for {
		if err := ctx.Err(); err != nil {
			return err
		}

		job, err := r.Protocol.Lease(ctx)
		if err != nil {
			r.Logger.Error("lease failed", "error", err)
			if sleepErr := sleep(ctx, backoff); sleepErr != nil {
				return sleepErr
			}
			backoff = nextBackoff(backoff, r.IdleBackoffMax)
			continue
		}
		if job == nil {
			r.Logger.Debug("no leasable job; idle backoff", "backoff", backoff.String())
			if sleepErr := sleep(ctx, backoff); sleepErr != nil {
				return sleepErr
			}
			backoff = nextBackoff(backoff, r.IdleBackoffMax)
			continue
		}

		backoff = r.IdleBackoff
		if err := r.handleJob(ctx, job); err != nil {
			r.Logger.Error("job handling failed", "jobId", job.ID, "error", err)
		}

		if sleepErr := sleep(ctx, r.PollInterval); sleepErr != nil {
			return sleepErr
		}
	}
}

func (r *Runner) handleJob(ctx context.Context, job *protocol.LeasedJob) error {
	if _, err := r.Protocol.Report(ctx, job.ID, "printing", ""); err != nil {
		return fmt.Errorf("report printing: %w", err)
	}

	payload, err := base64.StdEncoding.DecodeString(job.PayloadBase64)
	if err != nil {
		_, _ = r.Protocol.Report(ctx, job.ID, "failed", "invalid payloadBase64")
		return fmt.Errorf("decode payload: %w", err)
	}
	if len(payload) == 0 || (job.PayloadByteLength > 0 && len(payload) != job.PayloadByteLength) {
		msg := "payload byte length mismatch"
		_, _ = r.Protocol.Report(ctx, job.ID, "failed", msg)
		return fmt.Errorf("%s", msg)
	}

	if err := r.printJob(ctx, job, payload); err != nil {
		_, _ = r.Protocol.Report(ctx, job.ID, "failed", err.Error())
		return err
	}

	if _, err := r.Protocol.Report(ctx, job.ID, "succeeded", ""); err != nil {
		return fmt.Errorf("report succeeded: %w", err)
	}
	r.Logger.Info("job succeeded",
		"jobId", job.ID,
		"printerId", job.PrinterID,
		"printerAgentId", job.PrinterAgentID,
		"transport", job.ConnectionHints.Transport,
	)
	return nil
}

func (r *Runner) printJob(ctx context.Context, job *protocol.LeasedJob, payload []byte) error {
	hints := job.ConnectionHints
	switch hints.Transport {
	case "tcp":
		return r.Printer.PrintRawTCP(ctx, hints.Address, hints.Port, payload)
	case "usb":
		if hints.Path == "" {
			return fmt.Errorf("usb connectionHints.path is required")
		}
		return r.Printer.PrintRawUSB(ctx, hints.Path, payload)
	case "serial":
		if hints.Path == "" {
			return fmt.Errorf("serial connectionHints.path is required")
		}
		baud := 0
		if hints.BaudRate != nil {
			baud = *hints.BaudRate
		}
		return r.Printer.PrintRawSerial(ctx, hints.Path, baud, payload)
	default:
		return fmt.Errorf("unknown connectionHints.transport %q", hints.Transport)
	}
}

func nextBackoff(current, max time.Duration) time.Duration {
	next := current * 2
	if next > max {
		return max
	}
	return next
}

func sleep(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}
