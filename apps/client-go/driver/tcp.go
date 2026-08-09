// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

// Package driver provides separable raw transport helpers for the Go Printer Agent.
// This package MUST NOT import Print Queue Agent Protocol or agent orchestration code
// so it can be extracted into an MIT Go driver library later.
package driver

import (
	"context"
	"fmt"
	"net"
	"strconv"
	"time"
)

const defaultDialTimeout = 10 * time.Second

// PrintRawTCP dials address:port and writes payload bytes as a single TCP session.
// Typical ESC/POS network printers listen on port 9100.
func PrintRawTCP(ctx context.Context, address string, port int, payload []byte) error {
	if address == "" {
		return fmt.Errorf("tcp address is required")
	}
	if port < 1 || port > 65535 {
		return fmt.Errorf("tcp port must be between 1 and 65535")
	}
	if len(payload) == 0 {
		return fmt.Errorf("payload must not be empty")
	}

	dialer := net.Dialer{Timeout: defaultDialTimeout}
	conn, err := dialer.DialContext(ctx, "tcp", net.JoinHostPort(address, strconv.Itoa(port)))
	if err != nil {
		return fmt.Errorf("tcp dial %s:%d: %w", address, port, err)
	}
	defer conn.Close()

	if deadline, ok := ctx.Deadline(); ok {
		_ = conn.SetDeadline(deadline)
	}

	written := 0
	for written < len(payload) {
		n, writeErr := conn.Write(payload[written:])
		if writeErr != nil {
			return fmt.Errorf("tcp write: %w", writeErr)
		}
		written += n
	}
	return nil
}
