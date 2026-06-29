import { describe, expect, it } from "vitest";
import { isNegligibleDisplayBalance } from "../debt-simplification";

describe("isNegligibleDisplayBalance", () => {
  it("treats sub-10-cent balances as negligible for display", () => {
    expect(isNegligibleDisplayBalance(8)).toBe(true);
    expect(isNegligibleDisplayBalance(-8)).toBe(true);
  });

  it("does not treat normal balances as negligible", () => {
    expect(isNegligibleDisplayBalance(10)).toBe(false);
    expect(isNegligibleDisplayBalance(493)).toBe(false);
    expect(isNegligibleDisplayBalance(0)).toBe(false);
  });
});
