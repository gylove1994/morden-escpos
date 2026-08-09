// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package driver_test

import (
	"bytes"
	"context"
	"io"
	"net"
	"strconv"
	"testing"
	"time"

	"github.com/gylove1994/morden-node-escpos/apps/client-go/driver"
)

func TestPrintRawTCPWritesPayload(t *testing.T) {
	t.Parallel()

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer ln.Close()

	want := []byte{0x1b, 0x40, 0x48, 0x69, 0x0a}
	gotCh := make(chan []byte, 1)
	errCh := make(chan error, 1)

	go func() {
		conn, acceptErr := ln.Accept()
		if acceptErr != nil {
			errCh <- acceptErr
			return
		}
		defer conn.Close()
		_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
		buf, readErr := io.ReadAll(conn)
		if readErr != nil {
			errCh <- readErr
			return
		}
		gotCh <- buf
	}()

	host, portStr, err := net.SplitHostPort(ln.Addr().String())
	if err != nil {
		t.Fatalf("split: %v", err)
	}
	port, err := strconv.Atoi(portStr)
	if err != nil {
		t.Fatalf("port: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := driver.PrintRawTCP(ctx, host, port, want); err != nil {
		t.Fatalf("PrintRawTCP: %v", err)
	}

	select {
	case got := <-gotCh:
		if !bytes.Equal(got, want) {
			t.Fatalf("payload mismatch: got %v want %v", got, want)
		}
	case acceptErr := <-errCh:
		t.Fatalf("accept/read: %v", acceptErr)
	case <-time.After(3 * time.Second):
		t.Fatal("timed out waiting for TCP payload")
	}
}

func TestPrintRawTCPRejectsEmptyPayload(t *testing.T) {
	t.Parallel()
	err := driver.PrintRawTCP(context.Background(), "127.0.0.1", 9100, nil)
	if err == nil {
		t.Fatal("expected error for empty payload")
	}
}
