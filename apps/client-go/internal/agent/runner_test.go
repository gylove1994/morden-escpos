// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package agent_test

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"io"
	"log/slog"
	"net"
	"os"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/gylove1994/morden-node-escpos/apps/client-go/internal/agent"
	"github.com/gylove1994/morden-node-escpos/apps/client-go/internal/protocol"
)

type fakeProtocol struct {
	mu        sync.Mutex
	leases    []*protocol.LeasedJob
	leaseErrs []error
	reports   []string
	heartbeat *protocol.HeartbeatResponse
}

func (f *fakeProtocol) Heartbeat(context.Context) (*protocol.HeartbeatResponse, error) {
	if f.heartbeat == nil {
		return &protocol.HeartbeatResponse{
			Status:         "ok",
			PrinterAgentID: "pa_test",
			OrganizationID: "org_test",
		}, nil
	}
	return f.heartbeat, nil
}

func (f *fakeProtocol) Lease(context.Context) (*protocol.LeasedJob, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if len(f.leaseErrs) > 0 {
		err := f.leaseErrs[0]
		f.leaseErrs = f.leaseErrs[1:]
		return nil, err
	}
	if len(f.leases) == 0 {
		return nil, nil
	}
	job := f.leases[0]
	f.leases = f.leases[1:]
	return job, nil
}

func (f *fakeProtocol) Report(_ context.Context, jobID, status, errorMessage string) (*protocol.JobPublic, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	entry := status
	if errorMessage != "" {
		entry += ":" + errorMessage
	}
	f.reports = append(f.reports, jobID+"/"+entry)
	return &protocol.JobPublic{ID: jobID, Status: status}, nil
}

func TestRunnerDrainsTCPJob(t *testing.T) {
	t.Parallel()

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer ln.Close()

	payload := []byte{0x1b, 0x40, 0x48, 0x69, 0x0a}
	gotCh := make(chan []byte, 1)
	go func() {
		conn, acceptErr := ln.Accept()
		if acceptErr != nil {
			return
		}
		defer conn.Close()
		_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
		buf, _ := io.ReadAll(conn)
		gotCh <- buf
	}()

	host, portStr, _ := net.SplitHostPort(ln.Addr().String())
	port, _ := strconv.Atoi(portStr)

	proto := &fakeProtocol{
		leases: []*protocol.LeasedJob{
			{
				ID:                "job_1",
				PrinterID:         "ptr_1",
				PrinterAgentID:    "pa_1",
				Status:            "leased",
				PayloadBase64:     base64.StdEncoding.EncodeToString(payload),
				PayloadByteLength: len(payload),
				ConnectionHints: protocol.ConnectionHints{
					Transport: "tcp",
					Address:   host,
					Port:      port,
				},
			},
		},
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	runner := &agent.Runner{
		Protocol:         proto,
		Printer:          agent.TCPPrinter{},
		Logger:           slog.New(slog.NewTextHandler(io.Discard, nil)),
		PollInterval:     20 * time.Millisecond,
		IdleBackoff:      20 * time.Millisecond,
		IdleBackoffMax:   40 * time.Millisecond,
		HeartbeatOnStart: true,
	}

	done := make(chan error, 1)
	go func() { done <- runner.Run(ctx) }()

	select {
	case got := <-gotCh:
		if !bytes.Equal(got, payload) {
			t.Fatalf("printed %v want %v", got, payload)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("timed out waiting for TCP print")
	}

	// Allow report succeeded to land, then stop.
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		proto.mu.Lock()
		n := len(proto.reports)
		proto.mu.Unlock()
		if n >= 2 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	<-done

	proto.mu.Lock()
	defer proto.mu.Unlock()
	if len(proto.reports) < 2 {
		t.Fatalf("reports=%v", proto.reports)
	}
	if proto.reports[0] != "job_1/printing" {
		t.Fatalf("first report=%q", proto.reports[0])
	}
	if proto.reports[1] != "job_1/succeeded" {
		t.Fatalf("second report=%q", proto.reports[1])
	}
}

func TestRunnerIdleBackoffWhenNoWork(t *testing.T) {
	t.Parallel()
	proto := &fakeProtocol{}
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Millisecond)
	defer cancel()

	start := time.Now()
	runner := &agent.Runner{
		Protocol:       proto,
		Printer:        agent.TCPPrinter{},
		Logger:         slog.New(slog.NewTextHandler(io.Discard, nil)),
		PollInterval:   10 * time.Millisecond,
		IdleBackoff:    30 * time.Millisecond,
		IdleBackoffMax: 30 * time.Millisecond,
	}
	err := runner.Run(ctx)
	if !errors.Is(err, context.DeadlineExceeded) && !errors.Is(err, context.Canceled) {
		t.Fatalf("Run err=%v", err)
	}
	if time.Since(start) < 60*time.Millisecond {
		t.Fatalf("expected idle backoff to delay loop")
	}
}

func TestLocalPrinterDelegatesToDriver(t *testing.T) {
	t.Parallel()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer ln.Close()

	want := []byte("raw")
	gotCh := make(chan []byte, 1)
	go func() {
		conn, _ := ln.Accept()
		if conn == nil {
			return
		}
		defer conn.Close()
		buf, _ := io.ReadAll(conn)
		gotCh <- buf
	}()

	host, portStr, _ := net.SplitHostPort(ln.Addr().String())
	port, _ := strconv.Atoi(portStr)
	p := agent.LocalPrinter{}
	if err := p.PrintRawTCP(context.Background(), host, port, want); err != nil {
		t.Fatalf("PrintRawTCP: %v", err)
	}
	got := <-gotCh
	if !bytes.Equal(got, want) {
		t.Fatalf("got %q", got)
	}

	usbPath := t.TempDir() + "/lp0"
	if err := p.PrintRawUSB(context.Background(), usbPath, want); err != nil {
		t.Fatalf("PrintRawUSB: %v", err)
	}
	usbGot, err := os.ReadFile(usbPath)
	if err != nil {
		t.Fatalf("read usb: %v", err)
	}
	if !bytes.Equal(usbGot, want) {
		t.Fatalf("usb got %q", usbGot)
	}

	serialPath := t.TempDir() + "/ttyUSB0"
	if err := p.PrintRawSerial(context.Background(), serialPath, 9600, want); err != nil {
		t.Fatalf("PrintRawSerial: %v", err)
	}
	serialGot, err := os.ReadFile(serialPath)
	if err != nil {
		t.Fatalf("read serial: %v", err)
	}
	if !bytes.Equal(serialGot, want) {
		t.Fatalf("serial got %q", serialGot)
	}
}

func TestRunnerDrainsUSBAndSerialJobs(t *testing.T) {
	t.Parallel()

	payload := []byte{0x1b, 0x40, 0x52, 0x41, 0x57, 0x0a}
	usbPath := t.TempDir() + "/lp0"
	serialPath := t.TempDir() + "/ttyUSB0"
	baud := 115200

	proto := &fakeProtocol{
		leases: []*protocol.LeasedJob{
			{
				ID:                "job_usb",
				PrinterID:         "ptr_usb",
				PrinterAgentID:    "pa_1",
				Status:            "leased",
				PayloadBase64:     base64.StdEncoding.EncodeToString(payload),
				PayloadByteLength: len(payload),
				ConnectionHints: protocol.ConnectionHints{
					Transport: "usb",
					Path:      usbPath,
				},
			},
			{
				ID:                "job_serial",
				PrinterID:         "ptr_serial",
				PrinterAgentID:    "pa_1",
				Status:            "leased",
				PayloadBase64:     base64.StdEncoding.EncodeToString(payload),
				PayloadByteLength: len(payload),
				ConnectionHints: protocol.ConnectionHints{
					Transport: "serial",
					Path:      serialPath,
					BaudRate:  &baud,
				},
			},
		},
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	runner := &agent.Runner{
		Protocol:       proto,
		Printer:        agent.LocalPrinter{},
		Logger:         slog.New(slog.NewTextHandler(io.Discard, nil)),
		PollInterval:   10 * time.Millisecond,
		IdleBackoff:    10 * time.Millisecond,
		IdleBackoffMax: 20 * time.Millisecond,
	}

	done := make(chan error, 1)
	go func() { done <- runner.Run(ctx) }()

	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		proto.mu.Lock()
		n := len(proto.reports)
		proto.mu.Unlock()
		if n >= 4 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	<-done

	usbGot, err := os.ReadFile(usbPath)
	if err != nil {
		t.Fatalf("usb read: %v", err)
	}
	if !bytes.Equal(usbGot, payload) {
		t.Fatalf("usb payload=%v", usbGot)
	}
	serialGot, err := os.ReadFile(serialPath)
	if err != nil {
		t.Fatalf("serial read: %v", err)
	}
	if !bytes.Equal(serialGot, payload) {
		t.Fatalf("serial payload=%v", serialGot)
	}

	proto.mu.Lock()
	defer proto.mu.Unlock()
	if len(proto.reports) < 4 {
		t.Fatalf("reports=%v", proto.reports)
	}
}
