// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1

package protocol

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// ScenarioFile is the shared Print Queue Agent Protocol fixture manifest.
type ScenarioFile struct {
	Protocol         string              `json:"protocol"`
	Version          string              `json:"version"`
	BasePath         string              `json:"basePath"`
	Security         ScenarioSecurity    `json:"security"`
	Identifiers      map[string]string   `json:"identifiers"`
	Scenarios        []Scenario          `json:"scenarios"`
	StateTransitions map[string][]string `json:"stateTransitions"`
}

// ScenarioSecurity describes Bearer device-token auth.
type ScenarioSecurity struct {
	Scheme        string `json:"scheme"`
	Header        string `json:"header"`
	ValueTemplate string `json:"valueTemplate"`
}

// Scenario is one contract case.
type Scenario struct {
	ID          string         `json:"id"`
	Description string         `json:"description"`
	Steps       []ScenarioStep `json:"steps"`
}

// ScenarioStep is a single HTTP exchange.
type ScenarioStep struct {
	Operation string         `json:"operation"`
	Request   ScenarioReq    `json:"request"`
	Response  ScenarioExpect `json:"response"`
}

// ScenarioReq is the expected outbound request shape.
type ScenarioReq struct {
	Method      string            `json:"method"`
	Path        string            `json:"path"`
	Headers     map[string]string `json:"headers"`
	Body        json.RawMessage   `json:"body"`
	BodyFixture string            `json:"bodyFixture"`
}

// ScenarioExpect is the mocked inbound response.
type ScenarioExpect struct {
	Status      int    `json:"status"`
	BodyFixture string `json:"bodyFixture"`
	MetaFixture string `json:"metaFixture"`
}

// FixturesDir resolves apps/server/contracts/fixtures/v1 relative to this source file.
func FixturesDir() (string, error) {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("runtime.Caller failed")
	}
	// apps/client-go/internal/protocol -> apps/server/contracts/fixtures/v1
	dir := filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", "..", "server", "contracts", "fixtures", "v1"))
	if st, err := os.Stat(dir); err != nil || !st.IsDir() {
		return "", fmt.Errorf("shared fixtures dir not found at %s: %w", dir, err)
	}
	return dir, nil
}

// LoadScenarios loads scenarios.json from the shared fixtures directory.
func LoadScenarios() (ScenarioFile, string, error) {
	dir, err := FixturesDir()
	if err != nil {
		return ScenarioFile{}, "", err
	}
	raw, err := os.ReadFile(filepath.Join(dir, "scenarios.json"))
	if err != nil {
		return ScenarioFile{}, "", err
	}
	var sf ScenarioFile
	if err := json.Unmarshal(raw, &sf); err != nil {
		return ScenarioFile{}, "", err
	}
	return sf, dir, nil
}

// ReadFixture loads a JSON fixture file and expands ${placeholders}.
func ReadFixture(dir, name string, idents map[string]string) ([]byte, error) {
	if name == "" {
		return nil, nil
	}
	raw, err := os.ReadFile(filepath.Join(dir, name))
	if err != nil {
		return nil, err
	}
	return []byte(expandPlaceholders(string(raw), idents)), nil
}

func expandPlaceholders(s string, idents map[string]string) string {
	out := s
	for key, value := range idents {
		out = strings.ReplaceAll(out, "${"+key+"}", value)
	}
	return out
}
