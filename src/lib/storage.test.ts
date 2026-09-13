import { describe, it, expect, beforeEach } from "vitest";
import {
  loadHistory,
  saveHistoryItem,
  removeHistoryItem,
  clearAllHistory,
  exportHistoryJson,
  importHistoryJson,
} from "./storage";
import { FixItResponse } from "@/types";

const mockResponse: FixItResponse = {
  summary: "Sample summary",
  cause: "Sample cause",
  fix: "Sample fix",
  technology: "Docker",
  commands: [{ command: "docker ps", explanation: "List containers" }],
  nextSteps: ["Check logs"],
  confidence: "high",
};

describe("storage manager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should load empty history initially", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("should save and retrieve history items", () => {
    const error = "docker: connection refused";
    saveHistoryItem(error, mockResponse, "Ubuntu", "Bash");
    const items = loadHistory();
    expect(items).toHaveLength(1);
    expect(items[0].rawError).toBe(error);
    expect(items[0].technology).toBe("Docker");
  });

  it("should delete a specific history item", () => {
    saveHistoryItem("error 1", mockResponse);
    saveHistoryItem("error 2", mockResponse);
    let items = loadHistory();
    expect(items).toHaveLength(2);

    const idToDelete = items[0].id;
    removeHistoryItem(idToDelete);
    items = loadHistory();
    expect(items).toHaveLength(1);
    expect(items.some((i) => i.id === idToDelete)).toBe(false);
  });

  it("should clear all history items", () => {
    saveHistoryItem("error 1", mockResponse);
    saveHistoryItem("error 2", mockResponse);
    clearAllHistory();
    expect(loadHistory()).toEqual([]);
  });

  it("should export and import history JSON", () => {
    saveHistoryItem("exportable error", mockResponse, "Fedora");
    const exportedJson = exportHistoryJson();
    expect(exportedJson).toContain("exportable error");

    clearAllHistory();
    expect(loadHistory()).toHaveLength(0);

    const imported = importHistoryJson(exportedJson);
    expect(imported).toHaveLength(1);
    expect(imported[0].rawError).toBe("exportable error");
  });
});
