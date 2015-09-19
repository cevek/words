'use strict';

let TOKEN = {
    token: 'token',
    removed: 'removed',
    replaced: 'replaced',
    added: 'added',
    moved: 'moved',
    movedTo: 'moved-to',
    movedFrom: 'moved-from',
    correct: 'correct',
    misspelling: 'misspelling'
};

class Word {
    constructor(text, keyMap) {
        this.text = text;
        this.setKey(keyMap);
    }

    setKey(keyMap) {
        let key = this.text.toLocaleLowerCase().replace(/[^\w\d]+/g, '');
        //console.log(this.text, key);

        while (keyMap[key]) {
            key += '*';
        }
        this.key = key;
        keyMap[key] = this;
    }
}

class Words {
    constructor() {
        this.sync = null;
        this.words = null;
        this.postId = 'alisa';
        this.postData = alisaData;
        this.currentLine = 0;
        this.render();
        this.fill();
        this.setNextSentence();
    }

    doit(userText) {
        let originText = this.postData.data[this.currentLine][0];

        this.words = this.parseWords(userText);
        let originWords = this.parseWords(originText);

        this.sync = sync(this.words, originWords, (a, b)=>a.key === b.key);

        this.modify();

        this.fixOrder();
        this.merge();

        this.renderLine();

        this.currentLine++;
        this.setNextSentence();

        console.log(this.words, this.sync);
    }

    getData() {
        try {
            var item = localStorage[this.postId];
            if (item) {
                var dt = JSON.parse(item);
            }
            else {
                dt = {lines: []};
            }
        }
        catch (e) {
            console.error(e);
            dt = {lines: []};
        }
        return dt;
    }

    fill() {
        var data = this.getData();
        for (var i = 0; i < data.lines.length; i++) {
            var line = data.lines[i];
            this.doit(line);
        }
    }

    setNextSentence() {
        this.translate.textContent = this.postData.data[this.currentLine][1];
    }

    saveLine() {
        var data = this.getData();
        data.lines.push(this.text.value);
        localStorage[this.postId] = JSON.stringify(data);
        this.text.value = '';
    }

    parseWords(str) {
        let keyMap = {};
        let wordChunks = this.prepareStr(str).split(/ /);
        let words = [];
        for (let i = 0; i < wordChunks.length; i++) {
            words.push(new Word(wordChunks[i], keyMap));
        }
        words.keyMap = keyMap;
        return words;
    }

    prepareStr(str) {
        str = str.replace(/(-|–|—) +/ig, "$1\u00A0");
        str = str.replace(/\b(are|did|do|does|can|could|had|have|has|is|might|may|must|was|were|would) ?not\b/ig, "$1n’t");
        str = str.replace(/\b(I|he|she|they|we|you) (had)\b/ig, "$1’d");
        str = str.replace(/\b(I|they|we|you) have\b/ig, "$1’ve");
        str = str.replace(/\b(he|she|here|that|there|what) is\b/ig, "$1’s");
        str = str.replace(/\bI\b/ig, "I");
        str = str.replace(/\b(I) am\b/ig, "$1’m");
        str = str.replace(/\b(W)ill not\b/ig, "$1on’t");
        str = str.replace(/\b(let) us\b/ig, "$1’s");
        str = str.replace(/\b(I|you|he|she|it|we|they|that) will\b/ig, "$1’ll");
        str = str.replace(/'/ig, "’");
        str = str.replace(/\s+/g, " ");
        //str = str[0].toUpperCase() + str.slice(1);
        return str;
    }


    modify() {
        for (let i = 0; i < this.sync.length; i++) {
            let block = this.sync[i];
            if (block.type == TOKEN.added) {
                let word = block.node;
                word.type = TOKEN.added;
                if (block.next) {
                    let pos = this.words.findIndex(word => word.key == block.next.key);
                    this.words.splice(pos, 0, word);
                }
                else {
                    this.words.push(word);
                }
            }
            if (block.type == TOKEN.removed) {
                let word = block.node;
                word.type = TOKEN.removed;
            }
            if (block.type == TOKEN.moved) {
                let word = this.words.find(word => word.key == block.node.key);
                let pos = this.words.length;
                if (block.next) {
                    pos = this.words.findIndex(word => word.key == block.next.key);
                }
                var newWord = new Word(word.text, this.words.keyMap);
                newWord.movedFrom = word;
                newWord.type = TOKEN.movedTo;
                newWord.key = word.key;
                this.words.splice(pos, 0, newWord);
                word.key = null;
                word.type = TOKEN.movedFrom;
                word.movedTo = newWord;
            }
        }
    }

    merge() {
        var lastWord = this.words[0];
        var newWords = [];
        newWords.push(lastWord);
        for (var i = 1; i < this.words.length; i++) {
            var prevWord = this.words[i - 1];
            var thisWord = this.words[i];
            var merge = false;

            if (prevWord.type == TOKEN.movedFrom && thisWord.type == TOKEN.movedFrom) {
                var to1Pos = this.words.indexOf(prevWord.movedTo);
                var to2Pos = this.words.indexOf(thisWord.movedTo);
                if (to1Pos == to2Pos - 1) {
                    merge = true;
                }
            }
            else if (prevWord.type == TOKEN.movedTo && thisWord.type == TOKEN.movedTo) {
                var from1Pos = this.words.indexOf(prevWord.movedFrom);
                var from2Pos = this.words.indexOf(thisWord.movedFrom);
                if (from1Pos == from2Pos - 1) {
                    merge = true;
                }
            }
            else if (prevWord.type == thisWord.type) {
                merge = true;
            }

            if (merge) {
                lastWord.text = lastWord.text + ' ' + thisWord.text;
            }
            else {
                newWords.push(thisWord);
                lastWord = thisWord;
            }
        }
        this.words = newWords;
    }

    fixOrder() {
        for (var i = 0; i < this.words.length - 1; i++) {
            var word = this.words[i];
            var nextWord = this.words[i + 1];
            if (word.type == TOKEN.removed && nextWord.type == TOKEN.added) {
                if ((word.text.length - nextWord.text.length) > -5) {
                    var dist = levenshtein(nextWord.key, word.key);
                    if (dist <= 2 && nextWord.text.length > 3) {
                        nextWord.type = TOKEN.correct;
                        word.type = TOKEN.misspelling;
                    }
                    else {
                        nextWord.type = TOKEN.replaced;
                    }
                    this.words.splice(i, 0, nextWord);
                    this.words.splice(i + 2, 1);
                }
            }
        }
    }

    onSubmit() {
        this.doit(this.text.value);
        this.saveLine();
        return false;
    }

    render() {
        this.app = document.createElement('div');
        this.app.classList.add('app');
        document.body.appendChild(this.app);

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.app.appendChild(this.svg);

        this.items = document.createElement('div');
        this.items.classList.add('items');
        this.app.appendChild(this.items);

        this.form = document.createElement('form');
        this.form.classList.add('form');
        this.form.onsubmit = ()=>this.onSubmit();
        this.app.appendChild(this.form);

        this.translate = document.createElement('div');
        this.translate.classList.add('translate');
        this.form.appendChild(this.translate);

        this.text = document.createElement('input');
        this.text.classList.add('text');
        this.text.setAttribute('type', 'text');
        this.text.setAttribute('required', true);
        this.form.appendChild(this.text);
    }

    generateArrowPath(y, from, to) {
        var height = 20;
        var arrowSize = 5;
        var fromShift = 0;
        var toShift = 0;
        if (from < to) {
            var right = to;
            var left = from;
            toShift = arrowSize;
        }
        else {
            right = from;
            left = to;
            fromShift = arrowSize;
        }
        var top = y - height;
        return [
            `M${to - arrowSize},${y - arrowSize} h${arrowSize * 2} l-${arrowSize},${arrowSize} Z`,
            `M${left},${y - fromShift} C${left},${top} ${right},${top} ${right},${y - toShift}`
        ];
    }

    renderArrows(parent, arrows) {
        var xmlns = "http://www.w3.org/2000/svg";
        for (var i = 0; i < arrows.length; i++) {
            var arrow = arrows[i];
            var fromBounds = arrow.from.dom.getBoundingClientRect();
            var toBounds = arrow.to.dom.getBoundingClientRect();
            var paths = this.generateArrowPath(fromBounds.top, fromBounds.left + fromBounds.width / 2 | 0, toBounds.left + toBounds.width / 2 | 0);

            var pathNode = document.createElementNS(xmlns, 'path');
            pathNode.setAttribute('d', paths[1]);
            pathNode.setAttribute('class', 'line');
            this.svg.appendChild(pathNode);

            var arrowNode = document.createElementNS(xmlns, 'path');
            arrowNode.setAttribute('d', paths[0]);
            arrowNode.setAttribute('class', 'arrow');
            this.svg.appendChild(arrowNode);
        }

    }


    renderLine() {
        var node = document.createElement('div');
        node.classList.add('line');
        this.items.appendChild(node);

        var arrows = [];
        for (let i = 0; i < this.words.length; i++) {
            let word = this.words[i];
            let span = document.createElement('span');
            node.appendChild(span);
            if (word.type) {
                span.classList.add(TOKEN.token);
                span.classList.add(word.type);
            }
            if (word.type == 'moved-to') {
                arrows.push({from: word.movedFrom, to: word});
            }
            word.dom = span;
            span.textContent = word.text.trim();
            node.appendChild(document.createTextNode(' '));
        }
        this.renderArrows(node, arrows);
    }
}


var w = new Words();
//w.doit('with her money alisa the book buys');

