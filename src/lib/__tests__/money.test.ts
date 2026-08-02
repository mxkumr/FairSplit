import { describe, expect, it } from "vitest";
import {
  parseDollarsToCents,
  sanitizeMoneyInput,
  normalizeMoneyDecimal,
} from "../money";

describe("sanitizeMoneyInput", () => {
  it("keeps a trailing decimal separator while typing", () => {
    expect(sanitizeMoneyInput("10.")).toBe("10.");
    expect(sanitizeMoneyInput("10,")).toBe("10,");
  });

  it("allows up to two fractional digits with either separator", () => {
    expect(sanitizeMoneyInput("10.5")).toBe("10.5");
    expect(sanitizeMoneyInput("10,55")).toBe("10,55");
    expect(sanitizeMoneyInput("10.555")).toBe("10.55");
  });

  it("strips letters and keeps only the first separator", () => {
    expect(sanitizeMoneyInput("12a.3b4")).toBe("12.34");
    expect(sanitizeMoneyInput("1.2.3")).toBe("1.23");
  });
});

describe("parseDollarsToCents", () => {
  it("parses dot decimals", () => {
    expect(parseDollarsToCents("10")).toBe(1000);
    expect(parseDollarsToCents("10.5")).toBe(1050);
    expect(parseDollarsToCents("10.50")).toBe(1050);
    expect(parseDollarsToCents("10.")).toBe(1000);
    expect(parseDollarsToCents(".5")).toBe(50);
  });

  it("parses comma decimals used on EU keyboards", () => {
    expect(parseDollarsToCents("10,5")).toBe(1050);
    expect(parseDollarsToCents("10,50")).toBe(1050);
    expect(parseDollarsToCents("10,")).toBe(1000);
    expect(parseDollarsToCents(",99")).toBe(99);
  });

  it("handles mixed thousand separators", () => {
    expect(parseDollarsToCents("1,234.56")).toBe(123456);
    expect(parseDollarsToCents("1.234,56")).toBe(123456);
  });

  it("returns null for empty or invalid values", () => {
    expect(parseDollarsToCents("")).toBeNull();
    expect(parseDollarsToCents(".")).toBeNull();
    expect(parseDollarsToCents(",")).toBeNull();
    expect(parseDollarsToCents("abc")).toBeNull();
  });
});

describe("normalizeMoneyDecimal", () => {
  it("converts comma decimal to dot", () => {
    expect(normalizeMoneyDecimal("4,93")).toBe("4.93");
  });
});
