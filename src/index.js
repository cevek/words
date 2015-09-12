'use strict';
//let diff = JsDiff.diffWordsWithSpace(oldStr, newStr, {});
var items = document.getElementById('items');
var form = document.getElementById('form');
var text = document.getElementById('text');
form.onsubmit = function submit(){
    doit(text.value);
    return false;
};
//doit('He think, to calls me 1 me y 1 John');
//doit('the owner has giving the little money each month');

function doit(oldStr) {
    let newStr = "Alisa buys a book with her money";

    let words = parseWords(oldStr);
    let words2 = parseWords(newStr);

    let result = sync(words, words2);
    var div = document.createElement('div');
    div.classList.add('line');
    items.appendChild(div);
    render(div, words, words2);
    showAddedMoved(div, result);

}

function getKey(keyMap, key) {
    key = key.toLocaleLowerCase().replace(/[^\w\d]+/, '');
    while (keyMap[key]) {
        key += '*';
    }
    return key;
}

function parseWords(str) {
    let keyMap = {};
    let words = str.split(/\b(?=\w)/);
    let items = [];
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        let key = getKey(keyMap, word);
        let block = {key: key, word: word};
        keyMap[key] = block;
        items.push(block);
    }
    items.keyMap = keyMap;
    return items;
}

function showAddedMoved(node, sync) {
    //sync.added = sync.added.reverse();
    for (let i = 0; i < sync.added.length; i++) {
        let block = sync.added[i];
        let word = block.node;
        let span = document.createElement('span');
        span.textContent = word.word;
        span.classList.add('added');
        console.log(block, block.next ? block.next.node : null);
        word.node = span;
        node.insertBefore(span, block.next ? block.next.node : null);
    }
    for (let i = 0; i < sync.removed.length; i++) {
        let block = sync.removed[i];
        block.node.node.classList.add('removed');
    }
    for (let i = 0; i < sync.moved.length; i++) {
        let span = document.createElement('span');
        let block = sync.moved[i];
        var fromNode = block.node.node;
        var toNode = block.next.node;
        var rectFrom = fromNode.getBoundingClientRect();
        var rectTo = toNode.getBoundingClientRect();
        var x1 = rectTo.left - 2;
        var x2 = rectFrom.left + rectFrom.width / 2 - 2;

        var left = Math.min(x1, x2);
        span.style.left = left + 'px';
        span.style.width = Math.abs(x2 - x1) + 'px';

        span.classList.add('move-line');
        node.appendChild(span);

        fromNode.classList.add('moved');
    }
}


function render(node, words, words2) {
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        let span = document.createElement('span');
        node.appendChild(span);
        word.node = span;
        span.textContent = word.word;
        if (words2.keyMap[word.key]) {
            words2.keyMap[word.key].node = span;
        }
    }
}