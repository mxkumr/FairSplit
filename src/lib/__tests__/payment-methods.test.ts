import { describe, expect, it } from "vitest";
import { buildPaymentNote, parsePaymentNote } from "@/lib/payment-methods";

describe("payment-methods", () => {
  it("builds note from method only", () => {
    expect(buildPaymentNote("Cash")).toBe("Cash");
    expect(buildPaymentNote("Bank transfer")).toBe("Bank transfer");
  });

  it("builds note with extra details", () => {
    expect(buildPaymentNote("Cash", "handed over at dinner")).toBe(
      "Cash - handed over at dinner",
    );
  });

  it("parses stored notes back into method and extra note", () => {
    expect(parsePaymentNote("Bank transfer")).toEqual({
      method: "Bank transfer",
      extraNote: "",
    });
    expect(parsePaymentNote("Cash - ATM withdrawal")).toEqual({
      method: "Cash",
      extraNote: "ATM withdrawal",
    });
    expect(parsePaymentNote("legacy note")).toEqual({
      method: "Cash",
      extraNote: "legacy note",
    });
  });
});
