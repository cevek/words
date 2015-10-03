
function compareTwoArray(a, b, aStart, bStart, len) {
    for (var i = 0; i < len; i++) {
        if (a[aStart + i] != b[bStart + i]) {
            return false;
        }
    }
    return true;
}

function isInArray(a, b, aStart, len) {
    for (var i = 0; i <= b.length - len; i++) {
        if (compareTwoArray(a, b, aStart, i, len)) {
            return true;
        }
    }
    return false;
}
var w = null;

function words(str1, str2) {
    var last = 0;
    var items = [];
    var words1 = str1.split(/\s+/);
    var words2 = str2.split(/\s+/);
    w = words1;
    console.log(words1);

    var lastI = 0;
    for (var i = 0; i < words1.length; i++) {
        var word = null;
        console.log('i', i);

        for (var j = i + 1; j <= words1.length; j++) {
            console.log('j', j, "len", j - i);

            //var s = words1.substring(i, j + 1);
            //var findPos = str2.indexOf(s);
            var found = isInArray(words1, words2, i, j - i);


            if (!found) {
                console.debug('break');
                break;
            }
            else {
                console.log("slice", i, j);

                word = words1.slice(i, j).join(' ');
            }
        }
        console.log(word, i, j);

        if (word) {
            if (lastI != i) {
                items.push('-' + words1.slice(lastI, i).join(" "));
            }
            lastI = j - 1;
            i = j - 1;
            items.push(word);
        }
    }
    return items;
}
console.log(words('My is favourite girl Natalie', 'Is My favourite girl Natalie'));

