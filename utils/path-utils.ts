export function getParentPath(path: string) {
  const comps = path.split("/");
  return comps.slice(0, comps.length - 1).join("/");
}

export function getPathComponents(path: string) {
  return !path ? [] : path.split("/");
}

export function getAncestorPaths(path: string) {
  const comps = getPathComponents(path);
  let parent = "";
  const nest: string[] = [];
  for (const comp of comps) {
    nest.push(parent);
    parent = parent ? [parent, comp].join("/") : comp;
  }
  return nest;
}

export function getLastPathComponent(path: string) {
  const comps = getPathComponents(path);
  return comps[comps.length - 1] ?? "";
}

export function slicePath(path: string, depth: number) {
  if (depth < 1) {
    return "";
  }
  return getPathComponents(path).slice(0, depth).join("/");
}

export function pathContains(parent: string, child: string) {
  return !parent || parent === child || child.startsWith(parent + "/");
}

export function joinPath(parent: string, child: string) {
  return parent ? [parent, child].join("/") : child;
}
