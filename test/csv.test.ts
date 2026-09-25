import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("leaves plain values alone and blanks null", () => {
    expect(csvCell("Ana")).toBe("Ana");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("Gruber, Lukas")).toBe('"Gruber, Lukas"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralises spreadsheet formulas (CSV injection)", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("-1+2")).toBe("'-1+2");
    expect(csvCell("+436601234567")).toBe("'+436601234567");
  });
});

describe("toCsv", () => {
  it("writes a BOM, header and CRLF rows", () => {
    expect(toCsv(["Name", "Class"], [["María", "private"]])).toBe(
      "﻿Name,Class\r\nMaría,private\r\n"
    );
  });
});
