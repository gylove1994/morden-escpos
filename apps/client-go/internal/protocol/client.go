// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

// Package protocol implements the Print Queue Agent Protocol HTTP client.
package protocol

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const protocolPrefix = "/api/protocol/v1"

// Client talks to the Print Queue Agent Protocol as a Printer Agent.
type Client struct {
	baseURL     string
	deviceToken string
	httpClient  *http.Client
}

// NewClient constructs a Printer Agent protocol client.
// baseURL is the control-plane origin (no /api/protocol suffix required).
func NewClient(baseURL, deviceToken string, httpClient *http.Client) *Client {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	return &Client{
		baseURL:     strings.TrimRight(baseURL, "/"),
		deviceToken: deviceToken,
		httpClient:  httpClient,
	}
}

// Heartbeat authenticates the device token and acknowledges presence.
func (c *Client) Heartbeat(ctx context.Context) (*HeartbeatResponse, error) {
	var out HeartbeatResponse
	if err := c.doJSON(ctx, http.MethodPost, "/printer-agents/heartbeat", nil, http.StatusOK, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Lease short-polls for the next printable job.
// Returns (nil, nil) when the server responds 204 (no work).
func (c *Client) Lease(ctx context.Context) (*LeasedJob, error) {
	req, err := c.newRequest(ctx, http.MethodPost, "/jobs/lease", nil)
	if err != nil {
		return nil, err
	}
	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("lease request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNoContent {
		return nil, nil
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, fmt.Errorf("lease read body: %w", err)
	}
	if res.StatusCode != http.StatusOK {
		return nil, apiError(res.StatusCode, body)
	}
	var wrapped JobLeaseResponse
	if err := json.Unmarshal(body, &wrapped); err != nil {
		return nil, fmt.Errorf("lease decode: %w", err)
	}
	if wrapped.Job.ID == "" {
		return nil, fmt.Errorf("lease response missing job.id")
	}
	return &wrapped.Job, nil
}

// Report advances a leased job to printing, succeeded, or failed.
func (c *Client) Report(ctx context.Context, jobID, status string, errorMessage string) (*JobPublic, error) {
	payload := JobReportRequest{Status: status}
	if errorMessage != "" {
		payload.ErrorMessage = &errorMessage
	}
	var wrapped JobReportResponse
	path := "/jobs/" + jobID + "/report"
	if err := c.doJSON(ctx, http.MethodPost, path, payload, http.StatusOK, &wrapped); err != nil {
		return nil, err
	}
	return &wrapped.Job, nil
}

func (c *Client) doJSON(ctx context.Context, method, path string, requestBody any, wantStatus int, out any) error {
	req, err := c.newRequest(ctx, method, path, requestBody)
	if err != nil {
		return err
	}
	res, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("%s %s: %w", method, path, err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("%s %s read body: %w", method, path, err)
	}
	if res.StatusCode != wantStatus {
		return apiError(res.StatusCode, body)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("%s %s decode: %w", method, path, err)
	}
	return nil
}

func (c *Client) newRequest(ctx context.Context, method, path string, requestBody any) (*http.Request, error) {
	var body io.Reader
	if requestBody != nil {
		raw, err := json.Marshal(requestBody)
		if err != nil {
			return nil, fmt.Errorf("encode body: %w", err)
		}
		body = bytes.NewReader(raw)
	} else {
		body = http.NoBody
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+protocolPrefix+path, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.deviceToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	return req, nil
}

func apiError(status int, body []byte) error {
	var pe ProtocolError
	if json.Unmarshal(body, &pe) == nil && pe.Error != "" {
		return fmt.Errorf("protocol %d: %s (%s)", status, pe.Error, pe.Message)
	}
	return fmt.Errorf("protocol %d: %s", status, strings.TrimSpace(string(body)))
}
