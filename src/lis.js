function remove(node) {
    node.removed = true;
    console.log("remove", node);
}

function add(node, next) {
    node.added = next;
    console.log("add", node, next);
}

function move(node, next) {
    node.moved = next;
    console.log("move", node, next);
}

function update(node) {
    //console.log("update", node);
}

function sync(a, b, compare) {
    var aStart = 0;
    var bStart = 0;
    var aEnd = a.length - 1;
    var bEnd = b.length - 1;
    var i;
    var j;
    var aNode;
    var bNode;
    var lastTarget = 0;
    var pos;
    var node;
    var nextPos;
    var next;
    var ret = [];


    // Algorithm that works on simple cases with basic list transformations.
    //
    // It tries to reduce the diff problem by simultaneously iterating from the beginning and the end of both
    // lists, if keys are the same, they're synced, if node is moved from the beginning to the end of the
    // current cursor positions or vice versa it just performs move operation and continues to reduce the diff
    // problem.

    // We start by marking all nodes from b as inserted, then we try to find all removed nodes and
    // simultaneously perform syncs on the nodes that exists in both lists and replacing "inserted"
    // marks with the position of the node from the list b in list a. Then we just need to perform
    // slightly modified LIS algorithm, that ignores "inserted" marks and find common subsequence and
    // move all nodes that doesn't belong to this subsequence, or insert if they have "inserted" mark.
    var aLength = aEnd - aStart + 1;
    var bLength = bEnd - bStart + 1;
    var sources = new Array(bLength);

    // Mark all nodes as inserted.
    for (i = 0; i < bLength; i++) {
        sources[i] = -1;
    }

    var moved = false;
    var removeOffset = 0;

    for (i = aStart; i <= aEnd; i++) {
        var removed = true;
        aNode = a[i];
        for (j = bStart; j <= bEnd; j++) {
            bNode = b[j];
            if (compare(aNode,  bNode)) {
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
        var seq = lis(sources);
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

            } else {
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
    var p = a.slice(0);
    var result = [];
    result.push(0);
    var i;
    var il;
    var j;
    var u;
    var v;
    var c;

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