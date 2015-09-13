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
        let key = this.text.toLocaleLowerCase().replace(/[^\w\d]+/, '');
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
        this.render();
    }

    doit(userText) {
        let originText = "Alisa buys a book with her money";

        this.words = this.parseWords(userText);
        let originWords = this.parseWords(originText);

        this.sync = sync(this.words, originWords, (a, b)=>a.key === b.key);

        this.modify();

        this.merge();
        this.fixOrder();

        this.renderLine();
        console.log(this.words, this.sync);
    }

    parseWords(str) {
        let keyMap = {};
        let wordChunks = this.prepareStr(str).split(/\b(?=\w)/);
        let words = [];
        for (let i = 0; i < wordChunks.length; i++) {
            words.push(new Word(wordChunks[i], keyMap));
        }
        words.keyMap = keyMap;
        return words;
    }

    prepareStr(str) {
        str = str.replace(/\b(are|did|do|does|can|could|had|have|has|is|might|may|must|was|were|would) ?not\b/i, "$1n’t");
        str = str.replace(/\b(I|he|she|they|we|you) (had)\b/i, "$1’d");
        str = str.replace(/\b(I|they|we|you) have\b/i, "$1’ve");
        str = str.replace(/\b(he|she|here|that|there|what) is\b/i, "$1’s");
        str = str.replace(/\bI\b/i, "I");
        str = str.replace(/\b(I) am\b/i, "$1’m");
        str = str.replace(/\b(W)ill not\b/i, "$1on’t");
        str = str.replace(/\b(let) us\b/i, "$1’s");
        str = str.replace(/\b(I|you|he|she|it|we|they|that) will\b/i, "$1’ll");
        str = str.replace(/'/i, "’");
        str = str.replace(/\s+/, " ");
        str = str[0].toUpperCase() + str.slice(1);
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
                newWord.type = TOKEN.movedTo;
                newWord.key = word.key;
                this.words.splice(pos, 0, newWord);
                word.key = null;
                word.type = TOKEN.movedFrom;
            }
        }
    }

    merge() {
        for (var i = 0; i < this.words.length - 1; i++) {
            var word = this.words[i];
            var nextWord = this.words[i + 1];
            if (word.type == nextWord.type/* && word.type !== TOKEN.movedFrom && word.type !== TOKEN.movedTo*/) {
                this.words.splice(i, 1);
                nextWord.text = word.text + nextWord.text;
                i--;
            }
        }
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
        return false;
    }

    render() {
        this.app = document.createElement('div');
        this.app.classList.add('app');
        document.body.appendChild(this.app);

        this.items = document.createElement('div');
        this.items.classList.add('items');
        this.app.appendChild(this.items);

        this.form = document.createElement('form');
        this.form.classList.add('form');
        this.form.onsubmit = ()=>this.onSubmit();
        this.app.appendChild(this.form);

        this.text = document.createElement('input');
        this.text.classList.add('text');
        this.text.setAttribute('type', 'text');
        this.text.setAttribute('required', true);
        this.form.appendChild(this.text);
    }

    renderLine() {
        var node = document.createElement('div');
        node.classList.add('line');
        this.items.appendChild(node);


        for (let i = 0; i < this.words.length; i++) {
            let word = this.words[i];
            let span = document.createElement('span');
            node.appendChild(span);
            if (word.type) {
                span.classList.add(TOKEN.token);
                span.classList.add(word.type);
            }
            word.dom = span;
            span.textContent = word.text.trim();
            node.appendChild(document.createTextNode(' '));
        }
    }
}


var w = new Words();
w.doit('for her money alisa buys the book');

