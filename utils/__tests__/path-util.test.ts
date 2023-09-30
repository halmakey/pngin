import {
  getPathComponents,
  getAncestorPaths,
  getParentPath,
  slicePath,
  joinPath,
} from "../path-utils";

describe("getParentPath", () => {
  test("getParentPath empty", () => {
    expect(getParentPath("")).toBe("");
  });

  test("getParentPath nest 1", () => {
    expect(getParentPath("nest")).toBe("");
  });

  test("getParentPath nest 3", () => {
    expect(getParentPath("a/b/c")).toBe("a/b");
  });
});

describe("getPathComponents", () => {
  test("getPathComponents empty", () => {
    expect(getPathComponents("")).toEqual([]);
  });

  test("getPathComponents nest 3", () => {
    expect(getPathComponents("a/b/c")).toEqual(["a", "b", "c"]);
  });
});

describe("getAncestorPaths", () => {
  test("getAncestorPaths empty", () => {
    expect(getAncestorPaths("")).toEqual([]);
  });
  test("getAncestorPaths 1", () => {
    expect(getAncestorPaths("abc")).toEqual([""]);
  });
  test("getAncestorPaths 1", () => {
    expect(getAncestorPaths("a/b/c")).toEqual(["", "a", "a/b"]);
  });
});

describe("slicePath", () => {
  test("slicePath empty", () => {
    expect(slicePath("a/b/c/d", 0)).toBe("");
  });
  test("slicePath nest 2", () => {
    expect(slicePath("a/b/c/d", 2)).toBe("a/b");
  });
});

describe("joinPath", () => {
  test("joinPath from root", () => {
    expect(joinPath("", "abc")).toBe("abc");
  });
  test("joinPath nest 1", () => {
    expect(joinPath("abc", "def")).toBe("abc/def");
  });
});
