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

func TestPrintRawUSBWritesPayloadToPath(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	devicePath := filepath.Join(dir, "lp0")
	want := []byte{0x1b, 0x40, 0x55, 0x53, 0x42, 0x0a}

	if err := driver.PrintRawUSB(context.Background(), devicePath, want); err != nil {
		t.Fatalf("PrintRawUSB: %v", err)
	}

	got, err := os.ReadFile(devicePath)
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if !bytes.Equal(got, want) {
		t.Fatalf("payload mismatch: got %v want %v", got, want)
	}
}

func TestPrintRawUSBRejectsEmptyPathAndPayload(t *testing.T) {
	t.Parallel()
	if err := driver.PrintRawUSB(context.Background(), "", []byte{0x1b}); err == nil {
		t.Fatal("expected error for empty path")
	}
	if err := driver.PrintRawUSB(context.Background(), filepath.Join(t.TempDir(), "lp0"), nil); err == nil {
		t.Fatal("expected error for empty payload")
	}
}
