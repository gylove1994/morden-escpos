// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package driver

import (
	"context"
	"fmt"
)

const (
	defaultSerialBaudRate = 9600
	minSerialBaudRate     = 300
	maxSerialBaudRate     = 1_000_000
)

// PrintRawSerial writes payload bytes to a serial device path
// (for example `/dev/ttyUSB0` or `COM3`).
//
// baudRate selects the intended line speed. When baudRate is 0 the default
// (9600) is assumed for validation. Applying baud settings to a real UART is
// platform-specific; this thin transport writes the path and validates the
// baudRate range so protocol/adapter tests stay free of hardware gates.
// See TRANSPORT-CHECKLIST.md for manual verification with a real printer.
func PrintRawSerial(ctx context.Context, path string, baudRate int, payload []byte) error {
	if path == "" {
		return fmt.Errorf("serial path is required")
	}
	if baudRate == 0 {
		baudRate = defaultSerialBaudRate
	}
	if baudRate < minSerialBaudRate || baudRate > maxSerialBaudRate {
		return fmt.Errorf("serial baudRate must be between %d and %d", minSerialBaudRate, maxSerialBaudRate)
	}
	if err := writeRawDevicePath(ctx, path, payload); err != nil {
		return fmt.Errorf("serial (baudRate=%d): %w", baudRate, err)
	}
	return nil
}
