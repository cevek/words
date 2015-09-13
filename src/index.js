'use strict';
//let diff = JsDiff.diffWordsWithSpace(oldStr, newStr, {});
var items = document.getElementById('items');
var form = document.getElementById('form');
var text = document.getElementById('text');
form.onsubmit = function submit() {
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
    showAdded(div, result);
    showRemoved(div, result);
    showMoved(div, result);

}

class WordBlock {

}

class Words {
    constructor() {
        this.sync = null;
        this.words = null;
        this.userWords = null;
        this.origWords = null;

        this.items = document.getElementById('items');
        this.form = document.getElementById('form');
        this.text = document.getElementById('text');
        this.form.onsubmit = ()=>this.onSubmit();

    }

    onSubmit() {
        this.doit(this.text.value);
        return false;
    }


    doit(oldStr) {
        let newStr = "Alisa buys a book with her money";


        this.words = parseWords(oldStr);
        let words2 = parseWords(newStr);

        this.sync = sync(this.words, words2, (a, b)=>a.key === b.key);


        this.modify();

        this.merge();
        this.fixOrder();


        var div = document.createElement('div');
        div.classList.add('line');
        this.items.appendChild(div);

        this.render(div);
        console.log(this.words, this.sync);
    }

    modify(){
        for (let i = 0; i < this.sync.length; i++) {
            let block = this.sync[i];
            if (block.type == 'added'){
                let word = block.node;
                word.type = 'added';
                if (block.next) {
                    let pos = this.words.findIndex(word => word.key == block.next.key);
                    this.words.splice(pos, 0, word);
                }
                else {
                    this.words.push(word);
                }
            }
            if (block.type == 'removed'){
                let word = block.node;
                word.type = 'removed';
            }
            if (block.type == 'moved'){
                let word = this.words.find(word => word.key == block.node.key);
                if (block.next) {
                    let pos = this.words.findIndex(word => word.key == block.next.key);
                    this.words.splice(pos, 0, {word: word.word, key: word.key, type: 'moved-to'});
                    word.key = null;
                }
                word.type = 'moved-from';
            }
        }
    }

    merge() {
        for (var i = 0; i < this.words.length - 1; i++) {
            var word = this.words[i];
            var nextWord = this.words[i + 1];
            if (word.type == nextWord.type) {
                this.words.splice(i, 1);
                nextWord.word = word.word + nextWord.word;
                i--;
            }
        }
    }

    fixOrder() {
        for (var i = 0; i < this.words.length - 1; i++) {
            var word = this.words[i];
            var nextWord = this.words[i + 1];
            if (word.type == 'removed' && nextWord.type == 'added') {
                nextWord.type = 'replaced';
                this.words.splice(i, 0, nextWord);
                this.words.splice(i + 2, 1);
            }
        }
    }


    added() {
        for (let i = 0; i < this.sync.added.length; i++) {
            let block = this.sync.added[i];
            let word = block.node;
            word.type = 'added';
            if (block.next) {
                let pos = this.words.findIndex(word => word.key == block.next.key);
                this.words.splice(pos, 0, word);
            }
            else {
                this.words.push(word);
            }
        }

    }

    removed() {
        for (let i = 0; i < this.sync.removed.length; i++) {
            let block = this.sync.removed[i];
            let word = block.node;
            word.type = 'removed';
        }
    }

    moved() {
        for (let i = 0; i < this.sync.moved.length; i++) {
            let block = this.sync.moved[i];
            let word = this.words.find(word => word.key == block.node.key);
            if (block.next) {
                let pos = this.words.findIndex(word => word.key == block.next.key);
                this.words.splice(pos, 0, {word: word.word, key: word.key, type: 'moved-to'});
                word.key = null;
            }
            word.type = 'moved-from';
        }
    }

    render(node) {
        for (let i = 0; i < this.words.length; i++) {
            let word = this.words[i];
            let span = document.createElement('span');
            node.appendChild(span);
            if (word.type) {
                span.classList.add('token');
                span.classList.add(word.type);
            }
            word.node = span;
            span.textContent = word.word.trim();
            node.appendChild(document.createTextNode(' '));
        }
    }
}

var w = new Words();
w.doit('alise buys the book for own her money');


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

function showAdded(node, sync) {
    //sync.added = sync.added.reverse();
    let prevNode = null;
    for (let i = 0; i < sync.added.length; i++) {
        let block = sync.added[i];
        let word = block.node;
        let span = document.createElement('span');
        span.textContent = word.word;
        span.classList.add('added');
        console.log(block, block.next ? block.next.node : null);
        word.node = span;
        node.insertBefore(span, block.next ? block.next.node : null);
        if (prevNode == block.next) {
            span.textContent = word.word + prevNode.word;
            node.removeChild(prevNode.node);
        }
        prevNode = word;
    }
}
function showRemoved(node, sync) {
    //sync.added = sync.added.reverse();
    let prevNode = null;
    for (let i = 0; i < sync.removed.length; i++) {
        let block = sync.removed[i];
        let word = block.node;
        word.node.classList.add('removed');
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        let wordNode = node.childNodes[i];
        var next = node.childNodes[i + 1];
        if (wordNode.classList.contains('removed') && next && next.classList.contains('removed')) {
            wordNode.textContent = wordNode.textContent + next.textContent;
            node.removeChild(next);
        }
    }
}

function showMoved(node, sync) {
    //sync.added = sync.added.reverse();
    let prevNode = null;
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