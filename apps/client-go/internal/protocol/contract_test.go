// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package protocol_test

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"path"
	"strings"
	"testing"

	"github.com/gylove1994/morden-node-escpos/apps/client-go/internal/protocol"
)

func TestSharedFixturesExistAndNamePrinterAgent(t *testing.T) {
	t.Parallel()
	sf, dir, err := protocol.LoadScenarios()
	if err != nil {
		t.Fatalf("LoadScenarios: %v", err)
	}
	if sf.Protocol != "print-queue-agent-protocol" {
		t.Fatalf("protocol=%q", sf.Protocol)
	}
	if sf.BasePath != "/api/protocol/v1" {
		t.Fatalf("basePath=%q", sf.BasePath)
	}
	if _, ok := sf.Identifiers["printerAgentId"]; !ok {
		t.Fatal("identifiers must include printerAgentId")
	}
	if strings.Contains(strings.ToLower(sf.Scenarios[0].Description), " bare agent") {
		t.Fatal("fixture description must not use bare agent naming")
	}
	if dir == "" {
		t.Fatal("empty fixtures dir")
	}
	raw, err := protocol.ReadFixture(dir, "lease.job.response.json", sf.Identifiers)
	if err != nil {
		t.Fatalf("ReadFixture: %v", err)
	}
	if !bytes.Contains(raw, []byte(`"printerAgentId"`)) {
		t.Fatal("lease fixture missing printerAgentId")
	}
	if bytes.Contains(raw, []byte(`"agentId"`)) {
		t.Fatal("lease fixture must not use bare agentId")
	}
}

func TestContractScenariosAgainstGoClient(t *testing.T) {
	t.Parallel()
	sf, dir, err := protocol.LoadScenarios()
	if err != nil {
		t.Fatalf("LoadScenarios: %v", err)
	}

	for _, scenario := range sf.Scenarios {
		scenario := scenario
		t.Run(scenario.ID, func(t *testing.T) {
			t.Parallel()
			stepIndex := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if stepIndex >= len(scenario.Steps) {
					t.Errorf("unexpected extra request %s %s", r.Method, r.URL.Path)
					http.Error(w, "extra request", http.StatusInternalServerError)
					return
				}
				step := scenario.Steps[stepIndex]
				stepIndex++
				assertRequestMatches(t, sf, dir, step, r)

				w.WriteHeader(step.Response.Status)
				if step.Response.BodyFixture == "" {
					return
				}
				body, readErr := protocol.ReadFixture(dir, step.Response.BodyFixture, sf.Identifiers)
				if readErr != nil {
					t.Errorf("response fixture: %v", readErr)
					return
				}
				_, _ = w.Write(body)
			}))
			defer server.Close()

			client := protocol.NewClient(server.URL, sf.Identifiers["deviceToken"], server.Client())
			ctx := context.Background()

			for i, step := range scenario.Steps {
				switch step.Operation {
				case "heartbeat":
					if step.Response.Status == http.StatusOK {
						hb, hbErr := client.Heartbeat(ctx)
						if hbErr != nil {
							t.Fatalf("step %d heartbeat: %v", i, hbErr)
						}
						want, _ := protocol.ReadFixture(dir, step.Response.BodyFixture, sf.Identifiers)
						var expected protocol.HeartbeatResponse
						if err := json.Unmarshal(want, &expected); err != nil {
							t.Fatalf("decode expected heartbeat: %v", err)
						}
						if hb.PrinterAgentID != expected.PrinterAgentID {
							t.Fatalf("printerAgentId=%q want %q", hb.PrinterAgentID, expected.PrinterAgentID)
						}
						if hb.OrganizationID != expected.OrganizationID {
							t.Fatalf("organizationId=%q want %q", hb.OrganizationID, expected.OrganizationID)
						}
					} else {
						_, hbErr := client.Heartbeat(ctx)
						if hbErr == nil {
							t.Fatalf("step %d expected heartbeat error", i)
						}
					}
				case "lease":
					job, leaseErr := client.Lease(ctx)
					if step.Response.Status == http.StatusNoContent {
						if leaseErr != nil {
							t.Fatalf("step %d lease: %v", i, leaseErr)
						}
						if job != nil {
							t.Fatalf("step %d expected nil job on 204", i)
						}
						continue
					}
					if leaseErr != nil {
						t.Fatalf("step %d lease: %v", i, leaseErr)
					}
					want, _ := protocol.ReadFixture(dir, step.Response.BodyFixture, sf.Identifiers)
					var expected protocol.JobLeaseResponse
					if err := json.Unmarshal(want, &expected); err != nil {
						t.Fatalf("decode expected lease: %v", err)
					}
					if job.ID != expected.Job.ID {
						t.Fatalf("job.id=%q want %q", job.ID, expected.Job.ID)
					}
					if job.PrinterAgentID != expected.Job.PrinterAgentID {
						t.Fatalf("printerAgentId=%q want %q", job.PrinterAgentID, expected.Job.PrinterAgentID)
					}
					if job.ConnectionHints.Transport != "tcp" {
						t.Fatalf("transport=%q", job.ConnectionHints.Transport)
					}
					if job.PayloadByteLength != expected.Job.PayloadByteLength {
						t.Fatalf("payloadByteLength=%d", job.PayloadByteLength)
					}
					decoded, decErr := base64.StdEncoding.DecodeString(job.PayloadBase64)
					if decErr != nil {
						t.Fatalf("payload base64: %v", decErr)
					}
					if len(decoded) != job.PayloadByteLength {
						t.Fatalf("decoded len=%d want %d", len(decoded), job.PayloadByteLength)
					}
				case "report":
					body, _ := protocol.ReadFixture(dir, step.Request.BodyFixture, sf.Identifiers)
					var req protocol.JobReportRequest
					if err := json.Unmarshal(body, &req); err != nil {
						t.Fatalf("decode report request fixture: %v", err)
					}
					errMsg := ""
					if req.ErrorMessage != nil {
						errMsg = *req.ErrorMessage
					}
					job, reportErr := client.Report(ctx, sf.Identifiers["jobId"], req.Status, errMsg)
					if reportErr != nil {
						t.Fatalf("step %d report: %v", i, reportErr)
					}
					want, _ := protocol.ReadFixture(dir, step.Response.BodyFixture, sf.Identifiers)
					var expected protocol.JobReportResponse
					if err := json.Unmarshal(want, &expected); err != nil {
						t.Fatalf("decode expected report: %v", err)
					}
					if job.Status != expected.Job.Status {
						t.Fatalf("status=%q want %q", job.Status, expected.Job.Status)
					}
					if expected.Job.ErrorMessage != nil {
						if job.ErrorMessage == nil || *job.ErrorMessage != *expected.Job.ErrorMessage {
							t.Fatalf("errorMessage mismatch")
						}
					}
				default:
					t.Fatalf("unknown operation %q", step.Operation)
				}
			}
			if stepIndex != len(scenario.Steps) {
				t.Fatalf("server handled %d steps, scenario has %d", stepIndex, len(scenario.Steps))
			}
		})
	}
}

func TestStateTransitionsFixture(t *testing.T) {
	t.Parallel()
	sf, _, err := protocol.LoadScenarios()
	if err != nil {
		t.Fatalf("LoadScenarios: %v", err)
	}
	want := map[string][]string{
		"queued":    {"leased"},
		"leased":    {"printing"},
		"printing":  {"succeeded", "failed"},
		"succeeded": {},
		"failed":    {},
	}
	for from, to := range want {
		got, ok := sf.StateTransitions[from]
		if !ok {
			t.Fatalf("missing transition from %s", from)
		}
		if strings.Join(got, ",") != strings.Join(to, ",") {
			t.Fatalf("from %s: got %v want %v", from, got, to)
		}
	}
}

func assertRequestMatches(t *testing.T, sf protocol.ScenarioFile, dir string, step protocol.ScenarioStep, r *http.Request) {
	t.Helper()
	wantPath := sf.BasePath + expand(sf, step.Request.Path)
	if r.Method != step.Request.Method {
		t.Errorf("method=%s want %s", r.Method, step.Request.Method)
	}
	if r.URL.Path != wantPath {
		// Allow path.Clean equivalence
		if path.Clean(r.URL.Path) != path.Clean(wantPath) {
			t.Errorf("path=%s want %s", r.URL.Path, wantPath)
		}
	}
	for key, want := range step.Request.Headers {
		want = expand(sf, want)
		got := r.Header.Get(key)
		if got != want {
			t.Errorf("header %s=%q want %q", key, got, want)
		}
	}
	if step.Request.BodyFixture != "" {
		wantBody, err := protocol.ReadFixture(dir, step.Request.BodyFixture, sf.Identifiers)
		if err != nil {
			t.Fatalf("request body fixture: %v", err)
		}
		gotBody, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("read body: %v", err)
		}
		var wantAny any
		var gotAny any
		if err := json.Unmarshal(wantBody, &wantAny); err != nil {
			t.Fatalf("want body json: %v", err)
		}
		if err := json.Unmarshal(gotBody, &gotAny); err != nil {
			t.Fatalf("got body json: %v", err)
		}
		wantNorm, _ := json.Marshal(wantAny)
		gotNorm, _ := json.Marshal(gotAny)
		if !bytes.Equal(wantNorm, gotNorm) {
			t.Errorf("body=%s want %s", gotNorm, wantNorm)
		}
	}
}

func expand(sf protocol.ScenarioFile, s string) string {
	out := s
	for key, value := range sf.Identifiers {
		out = strings.ReplaceAll(out, "${"+key+"}", value)
	}
	return out
}
