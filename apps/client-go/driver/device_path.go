// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package driver

import (
	"context"
	"fmt"
	"os"
)

// writeRawDevicePath opens path and writes payload bytes.
// Used by USB device nodes and Serial ports that are already OS-configured.
// Temp files are valid stand-ins in adapter tests (no real hardware required).
func writeRawDevicePath(ctx context.Context, path string, payload []byte) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if path == "" {
		return fmt.Errorf("device path is required")
	}
	if len(payload) == 0 {
		return fmt.Errorf("payload must not be empty")
	}

	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o600)
	if err != nil {
		return fmt.Errorf("open device path %s: %w", path, err)
	}
	defer f.Close()

	if deadline, ok := ctx.Deadline(); ok {
		_ = f.SetWriteDeadline(deadline)
	}

	written := 0
	for written < len(payload) {
		if err := ctx.Err(); err != nil {
			return err
		}
		n, writeErr := f.Write(payload[written:])
		if writeErr != nil {
			return fmt.Errorf("write device path %s: %w", path, writeErr)
		}
		written += n
	}
	return nil
}
