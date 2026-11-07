// Hide a run only when it saves space; a one-line run stays visible.
const minimumHidden = 2

export function groupChanges(rows) {
  const changes = []
  for (let index = 0; index < rows.length; index++) {
    if (rows[index].kind === "same") continue
    const start = index
    while (index + 1 < rows.length && rows[index + 1].kind !== "same") index++
    changes.push({ start, end: index + 1 })
  }
  return changes
}

export function collapseRows(rows, context, expanded = []) {
  const open = new Set(expanded)
  const items = []
  const pushRows = (from, to) => {
    for (let index = from; index < to; index++) items.push({ kind: "row", index })
  }
  let index = 0
  while (index < rows.length) {
    if (rows[index].kind !== "same") {
      items.push({ kind: "row", index: index++ })
      continue
    }
    let end = index
    while (end < rows.length && rows[end].kind === "same") end++
    // Leading and trailing runs only need context next to the adjacent change.
    const from = index === 0 ? 0 : index + context
    const to = end === rows.length ? end : end - context
    if (to - from >= minimumHidden && !open.has(from)) {
      pushRows(index, from)
      items.push({ kind: "collapsed", from, to, count: to - from })
      pushRows(to, end)
    } else {
      pushRows(index, end)
    }
    index = end
  }
  return items
}
