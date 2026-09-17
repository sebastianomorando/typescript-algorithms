export const colors = {
  black: { label: "Nero", fill: "#303d38" },
  red: { label: "Rosso", fill: "#d66558" },
  green: { label: "Verde", fill: "#568568" },
  blue: { label: "Blu", fill: "#5c83aa" },
  purple: { label: "Viola", fill: "#9473a8" },
  amber: { label: "Ambra", fill: "#b58336" },
} as const;

export type Color = keyof typeof colors;
export type TreeNode = { id: string; value: string; color: Color; x: number; y: number; parent: string | null };
export type Tree = TreeNode[];
export const clone = (tree: Tree): Tree => tree.map(node => ({ ...node }));

export function example(): Tree {
  return [
    { id: "a", value: "40", color: "black", x: 0, y: 0, parent: null },
    { id: "b", value: "20", color: "red", x: -165, y: 130, parent: "a" },
    { id: "c", value: "60", color: "black", x: 165, y: 130, parent: "a" },
    { id: "d", value: "10", color: "black", x: -250, y: 260, parent: "b" },
    { id: "e", value: "30", color: "black", x: -80, y: 260, parent: "b" },
    { id: "f", value: "50", color: "red", x: 80, y: 260, parent: "c" },
    { id: "g", value: "70", color: "red", x: 250, y: 260, parent: "c" },
  ];
}

export function descendants(tree: Tree, id: string): Set<string> {
  const found = new Set([id]);
  const pending = [id];
  while (pending.length) {
    const parent = pending.pop();
    for (const node of tree) {
      if (node.parent === parent && !found.has(node.id)) {
        found.add(node.id);
        pending.push(node.id);
      }
    }
  }
  return found;
}

export function reparent(tree: Tree, id: string, parent: string | null): Tree {
  if (!tree.some(node => node.id === id)) throw new Error("Nodo non trovato.");
  if (parent !== null && !tree.some(node => node.id === parent)) throw new Error("Padre non trovato.");
  if (parent !== null && descendants(tree, id).has(parent)) {
    throw new Error("Questo collegamento creerebbe un ciclo. Scegli un altro padre.");
  }
  return tree.map(node => node.id === id ? { ...node, parent } : { ...node });
}

export function removeNode(tree: Tree, id: string, subtree = false): Tree {
  const removed = subtree ? descendants(tree, id) : new Set([id]);
  return tree.filter(node => !removed.has(node.id)).map(node => ({
    ...node, parent: node.parent && removed.has(node.parent) ? null : node.parent,
  }));
}

export function arrange(tree: Tree): Tree {
  const result = clone(tree);
  const ordered = (parent: string | null) => result.filter(node => node.parent === parent).sort((a, b) => a.x - b.x);
  let cursor = 0;
  function visit(node: TreeNode, depth: number) {
    const children = ordered(node.id);
    children.forEach(child => visit(child, depth + 1));
    node.x = children.length ? (children[0]!.x + children.at(-1)!.x) / 2 : cursor++ * 110;
    node.y = depth * 130;
  }
  for (const root of ordered(null)) { visit(root, 0); cursor++; }
  return result;
}

export function parseTree(value: unknown): Tree {
  if (!Array.isArray(value) || value.length > 500) throw new Error("Il file deve contenere un albero con al massimo 500 nodi.");
  const ids = new Set<string>();
  const tree: Tree = value.map(node => {
    if (!node || typeof node.id !== "string" || !node.id || ids.has(node.id)
      || typeof node.value !== "string" || node.value.length > 80
      || !Object.hasOwn(colors, node.color) || !Number.isFinite(node.x) || !Number.isFinite(node.y)
      || Math.abs(node.x) > 100000 || Math.abs(node.y) > 100000
      || (node.parent !== null && typeof node.parent !== "string")) throw new Error("Il file contiene nodi non validi.");
    ids.add(node.id);
    return { id: node.id, value: node.value, color: node.color, x: node.x, y: node.y, parent: node.parent };
  });
  for (const node of tree) {
    const path = new Set([node.id]);
    let parent = node.parent;
    while (parent !== null) {
      if (!ids.has(parent) || path.has(parent)) throw new Error("L’albero contiene un ciclo o un padre inesistente.");
      path.add(parent);
      parent = tree.find(candidate => candidate.id === parent)!.parent;
    }
  }
  return tree;
}

export class History {
  private past: { tree: Tree; label: string }[] = [];
  private future: { tree: Tree; label: string }[] = [];
  label = "Stato iniziale";
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  get count() { return this.past.length; }
  commit(before: Tree, after: Tree, label: string): boolean {
    if (JSON.stringify(before) === JSON.stringify(after)) return false;
    this.past.push({ tree: clone(before), label: this.label });
    if (this.past.length > 100) this.past.shift();
    this.future = [];
    this.label = label;
    return true;
  }
  undo(current: Tree): Tree {
    const previous = this.past.pop();
    if (!previous) return current;
    this.future.push({ tree: clone(current), label: this.label });
    this.label = previous.label;
    return clone(previous.tree);
  }
  redo(current: Tree): Tree {
    const next = this.future.pop();
    if (!next) return current;
    this.past.push({ tree: clone(current), label: this.label });
    this.label = next.label;
    return clone(next.tree);
  }
}
