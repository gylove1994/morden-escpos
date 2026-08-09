// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package protocol

// ConnectionHintsTCP is the TCP variant of leased-job connection hints.
type ConnectionHintsTCP struct {
	Transport string `json:"transport"`
	Address   string `json:"address"`
	Port      int    `json:"port"`
}

// ConnectionHints is a transport discriminant carried on leased jobs.
type ConnectionHints struct {
	Transport string `json:"transport"`
	Address   string `json:"address,omitempty"`
	Port      int    `json:"port,omitempty"`
	Path      string `json:"path,omitempty"`
	BaudRate  *int   `json:"baudRate,omitempty"`
}

// LeasedJob is the exclusive job payload returned by POST /jobs/lease.
type LeasedJob struct {
	ID                string          `json:"id"`
	PrinterID         string          `json:"printerId"`
	PrinterAgentID    string          `json:"printerAgentId"`
	Status            string          `json:"status"`
	PayloadBase64     string          `json:"payloadBase64"`
	PayloadByteLength int             `json:"payloadByteLength"`
	ConnectionHints   ConnectionHints `json:"connectionHints"`
	LeaseExpiresAt    string          `json:"leaseExpiresAt"`
	CreatedAt         string          `json:"createdAt"`
}

// JobLeaseResponse wraps a leased job.
type JobLeaseResponse struct {
	Job LeasedJob `json:"job"`
}

// JobReportRequest advances a leased job through printing → succeeded | failed.
type JobReportRequest struct {
	Status       string  `json:"status"`
	ErrorMessage *string `json:"errorMessage,omitempty"`
}

// JobPublic is the job snapshot returned by report.
type JobPublic struct {
	ID                string  `json:"id"`
	OrganizationID    string  `json:"organizationId"`
	PrinterID         string  `json:"printerId"`
	PrinterAgentID    string  `json:"printerAgentId"`
	Status            string  `json:"status"`
	PayloadBase64     string  `json:"payloadBase64"`
	PayloadByteLength int     `json:"payloadByteLength"`
	IdempotencyKey    *string `json:"idempotencyKey"`
	LeaseExpiresAt    *string `json:"leaseExpiresAt"`
	ErrorMessage      *string `json:"errorMessage"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
	LeasedAt          *string `json:"leasedAt"`
	PrintingAt        *string `json:"printingAt"`
	CompletedAt       *string `json:"completedAt"`
}

// JobReportResponse wraps a public job.
type JobReportResponse struct {
	Job JobPublic `json:"job"`
}

// HeartbeatResponse is returned by POST /printer-agents/heartbeat.
type HeartbeatResponse struct {
	Status         string `json:"status"`
	PrinterAgentID string `json:"printerAgentId"`
	OrganizationID string `json:"organizationId"`
}

// ProtocolError is the standard error body.
type ProtocolError struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}
