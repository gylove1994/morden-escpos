// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package driver

import (
	"context"
	"fmt"
)

// PrintRawUSB writes payload bytes to a USB printer device path
// (for example `/dev/usb/lp0` on Linux).
func PrintRawUSB(ctx context.Context, path string, payload []byte) error {
	if path == "" {
		return fmt.Errorf("usb path is required")
	}
	if err := writeRawDevicePath(ctx, path, payload); err != nil {
		return fmt.Errorf("usb: %w", err)
	}
	return nil
}
