import { describe, expect, test } from "bun:test";
import { arrange, clone, descendants, example, History, parseTree, removeNode, reparent } from "./tree";

describe("Tree Lab", () => {
  test("reattaches a whole subtree without changing its descendants", () => {
    const original = example();
    const next = reparent(original, "b", "c");
    expect(next.find(node => node.id === "b")!.parent).toBe("c");
    expect([...descendants(next, "b")]).toEqual(["b", "d", "e"]);
    expect(original.find(node => node.id === "b")!.parent).toBe("a");
  });

  test("prevents self links, cycles and links to missing nodes", () => {
    for (const parent of ["a", "d", "missing"]) expect(() => reparent(example(), "a", parent)).toThrow();
    expect(() => reparent(example(), "missing", "a")).toThrow();
  });

  test("detaches a subtree while preserving its internal connections", () => {
    const tree = reparent(example(), "b", null);
    expect(tree.filter(node => node.parent === null).map(node => node.id)).toEqual(["a", "b"]);
    expect([...descendants(tree, "b")]).toEqual(["b", "d", "e"]);
  });

  test("deleting a node preserves its children as independent roots", () => {
    const tree = removeNode(example(), "b");
    expect(tree).toHaveLength(6);
    expect(tree.filter(node => node.parent === null).map(node => node.id)).toEqual(["a", "d", "e"]);
    expect(parseTree(tree)).toEqual(tree);
  });

  test("deleting a subtree leaves unrelated branches untouched", () => {
    expect(removeNode(example(), "b", true).map(node => node.id)).toEqual(["a", "c", "f", "g"]);
    expect(removeNode(example(), "a", true)).toEqual([]);
  });

  test("undo and redo restore positions, values, colors and links together", () => {
    const history = new History();
    const before = example();
    const after = reparent(before, "b", "c");
    Object.assign(after[1]!, { x: 900, value: "new", color: "blue" });
    history.commit(before, after, "Edit");
    expect(history.undo(after)).toEqual(before);
    expect(history.label).toBe("Stato iniziale");
    expect(history.redo(before)).toEqual(after);
    expect(history.label).toBe("Edit");
    after[1]!.value = "mutated";
    expect(history.undo(after)).toEqual(before);
  });

  test("a new action clears redo; no-op actions do not create steps", () => {
    const history = new History();
    const before = example();
    const next = removeNode(before, "b");
    expect(history.commit(before, clone(before), "No change")).toBe(false);
    expect(history.canUndo).toBe(false);
    history.commit(before, next, "Delete");
    history.undo(next);
    expect(history.canRedo).toBe(true);
    history.commit(before, [], "Clear");
    expect(history.canRedo).toBe(false);
  });

  test("arranging a forest preserves links, values and colors and separates trees", () => {
    const before = reparent(example(), "b", null);
    const after = arrange(before);
    expect(after.map(({ x, y, ...node }) => node)).toEqual(before.map(({ x, y, ...node }) => node));
    expect(new Set(after.map(node => `${node.x},${node.y}`)).size).toBe(after.length);
    for (const node of after) {
      if (node.parent) expect(node.y).toBeGreaterThan(after.find(parent => parent.id === node.parent)!.y);
    }
  });

  test("validates imported forests, including empty ones and arbitrary text", () => {
    expect(parseTree([])).toEqual([]);
    const tree = example();
    tree[0]!.value = "<script>alert(1)</script>";
    expect(parseTree(JSON.parse(JSON.stringify(tree)))).toEqual(tree);
  });

  test("rejects duplicate ids, invalid data, missing parents and cycles", () => {
    const badValues: unknown[] = [null, {}, [...example(), example()[0]], Array(501).fill(example()[0])];
    for (const change of [{ parent: "d" }, { parent: "missing" }, { color: "toString" }, { x: Infinity }, { value: 42 }, { value: "x".repeat(81) }]) {
      const tree = example();
      Object.assign(tree[0]!, change);
      badValues.push(tree);
    }
    for (const value of badValues) expect(() => parseTree(value)).toThrow();
  });
});
