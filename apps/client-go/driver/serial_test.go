// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package driver_test

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/gylove1994/morden-node-escpos/apps/client-go/driver"
)

func TestPrintRawSerialWritesPayloadToPath(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	devicePath := filepath.Join(dir, "ttyUSB0")
	want := []byte{0x1b, 0x40, 0x53, 0x45, 0x52, 0x0a}

	if err := driver.PrintRawSerial(context.Background(), devicePath, 115200, want); err != nil {
		t.Fatalf("PrintRawSerial: %v", err)
	}

	got, err := os.ReadFile(devicePath)
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if !bytes.Equal(got, want) {
		t.Fatalf("payload mismatch: got %v want %v", got, want)
	}
}

func TestPrintRawSerialRejectsInvalidBaud(t *testing.T) {
	t.Parallel()
	path := filepath.Join(t.TempDir(), "ttyUSB0")
	if err := driver.PrintRawSerial(context.Background(), path, 100, []byte{0x1b}); err == nil {
		t.Fatal("expected error for baudRate below minimum")
	}
}
