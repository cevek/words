function remove(node) {
    node.removed = true;
    console.log('remove', node);
}

function add(node, next) {
    node.added = next;
    console.log('add', node, next);
}

function move(node, next) {
    node.moved = next;
    console.log('move', node, next);
}

function update(node) {
    //console.log('update', node);
}

export function sync(a, b, compare) {
    const aStart = 0;
    const bStart = 0;
    const aEnd = a.length - 1;
    const bEnd = b.length - 1;
    let i;
    let j;
    let aNode;
    let bNode;
    let lastTarget = 0;
    let pos;
    let node;
    let nextPos;
    let next;
    const ret = [];


    // Algorithm that works on simple cases with basic list transformations.
    //
    // It tries to reduce the diff problem by simultaneously iterating from the beginning and the end of both
    // lists, if keys are the same, they're synced, if node is moved from the beginning to the end of the
    // current cursor positions or vice versa it just performs move operation and continues to reduce the diff
    // problem.

    // We start by marking all nodes from b as inserted, then we try to find all removed nodes and
    // simultaneously perform syncs on the nodes that exists in both lists and replacing 'inserted'
    // marks with the position of the node from the list b in list a. Then we just need to perform
    // slightly modified LIS algorithm, that ignores 'inserted' marks and find common subsequence and
    // move all nodes that doesn't belong to this subsequence, or insert if they have 'inserted' mark.
    const aLength = aEnd - aStart + 1;
    const bLength = bEnd - bStart + 1;
    const sources = new Array(bLength);

    // Mark all nodes as inserted.
    for (i = 0; i < bLength; i++) {
        sources[i] = -1;
    }

    let moved = false;
    let removeOffset = 0;

    for (i = aStart; i <= aEnd; i++) {
        let removed = true;
        aNode = a[i];
        for (j = bStart; j <= bEnd; j++) {
            bNode = b[j];
            if (compare(aNode, bNode)) {
                sources[j - bStart] = i;

                if (lastTarget > j) {
                    moved = true;
                } else {
                    lastTarget = j;
                }
                //update(bNode);
                removed = false;
                break;
            }
        }
        if (removed) {
            //remove(aNode);
            ret.push({node: aNode, type: 'removed'});

            removeOffset++;
        }
    }

    if (moved) {
        const seq = lis(sources);
        // All modifications are performed from the right to left, so we can use insertBefore method and use
        // reference to the html element from the next VNode. All Nodes from the right side should always be
        // in the correct state.
        j = seq.length - 1;
        for (i = bLength - 1; i >= 0; i--) {
            if (sources[i] === -1) {
                pos = i + bStart;
                node = b[pos];
                nextPos = pos + 1;
                next = nextPos < b.length ? b[nextPos] : null;
                //add(node, next);
                ret.push({node: node, next: next, type: 'added'});
            }
            else {
                if (j < 0 || i !== seq[j]) {
                    pos = i + bStart;
                    node = b[pos];
                    nextPos = pos + 1;
                    next = nextPos < b.length ? b[nextPos] : null;
                    //move(node, next);
                    ret.push({node: node, next: next, type: 'moved'});
                } else {
                    j--;
                }
            }
        }
    } else if (aLength - removeOffset !== bLength) {
        for (i = bLength - 1; i >= 0; i--) {
            if (sources[i] === -1) {
                pos = i + bStart;
                node = b[pos];
                nextPos = pos + 1;
                next = nextPos < b.length ? b[nextPos] : null;
                //add(node, next);
                ret.push({node: node, next: next, type: 'added'});
            }
        }
    }
    return ret;
}

/**
 * Slightly modified Longest Increased Subsequence algorithm, it ignores items that have -1 value.
 * They're representing new items.
 *
 * This algorithm is used to find minimum number of move operations when updating children with explicit
 * keys.
 *
 * http://en.wikipedia.org/wiki/Longest_increasing_subsequence
 *
 * @param {!Array<number>} a
 * @returns {!Array<number>}
 * @package
 */
function lis(a) {
    const p = a.slice(0);
    const result = [];
    result.push(0);
    let i;
    let il;
    let j;
    let u;
    let v;
    let c;

    for (i = 0, il = a.length; i < il; i++) {
        if (a[i] === -1) {
            continue;
        }

        j = result[result.length - 1];
        if (a[j] < a[i]) {
            p[i] = j;
            result.push(i);
            continue;
        }

        u = 0;
        v = result.length - 1;

        while (u < v) {
            c = ((u + v) / 2) | 0;
            if (a[result[c]] < a[i]) {
                u = c + 1;
            } else {
                v = c;
            }
        }

        if (a[i] < a[result[u]]) {
            if (u > 0) {
                p[i] = result[u - 1];
            }
            result[u] = i;
        }
    }

    u = result.length;
    v = result[u - 1];

    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }

    return result;
}

export function levenshtein(aStr, bStr) {
    let cost;
    let a = aStr;
    let b = bStr;
    let m = a.length;
    let n = b.length;

    // make sure a.length >= b.length to use O(min(n,m)) space, whatever that is
    if (m < n) {
        const c = a;
        a = b;
        b = c;
        const o = m;
        m = n;
        n = o;
    }

    const r = [];
    r[0] = [];
    for (let c = 0; c < n + 1; ++c) {
        r[0][c] = c;
    }

    for (let i = 1; i < m + 1; ++i) {
        r[i] = [];
        r[i][0] = i;
        for (let j = 1; j < n + 1; ++j) {
            cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
            r[i][j] = Math.min(r[i - 1][j] + 1, r[i][j - 1] + 1, r[i - 1][j - 1] + cost);
        }
    }
    return r[r.length - 1][r[r.length - 1].length - 1];
}
