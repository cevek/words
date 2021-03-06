'use strict';

//todo: the same keys => ..s, his-him-her, at-to-into, 1 sym mistake,
//todo: last the a is must be separatly


class WordProcessor {
    constructor(originText, userText) {
        this.words = this.parseWords(userText);
        let originWords = this.parseWords(originText);

        this.sync = sync(this.words, originWords, (a, b)=>a.key === b.key);
        this.modify();
        this.fixOrder();
        this.merge();
        this.fixMovings();
        this.removeSameInsertRemoves();
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
        str = str.replace(/\b(are|did|do|does|can|could|had|have|has|is|might|may|must|was|were|would) ?not\b/ig, "$1n’t");
        str = str.replace(/\b(You|we|they) (are)\b/ig, "$1’re");
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
        str = str.replace(/(-|–|—) +/ig, "$1\u00A0");
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
                this.move(block, i);
            }
        }
    }

    canMove(word) {
        return !word.cleanText.match(/^(a|the|and|to)$/);
    }

    move(block, blockPos) {
        let word = this.words.find(word => word.key == block.node.key);
        let pos = this.words.length;
        if (block.next) {
            pos = this.words.findIndex(word => word.key == block.next.key);
        }
        var newWord = new Word(block.node.text, this.words.keyMap);
        newWord.movedFrom = word;

        newWord.type = TOKEN.movedTo;
        newWord.key = word.key;
        this.words.splice(pos, 0, newWord);
        word.key = null;
        word.type = TOKEN.movedFrom;
        word.movedTo = newWord;
        return {word: word, pos: pos, newWord: newWord};
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
                lastWord.cleanText = lastWord.cleanText + ' ' + thisWord.cleanText;
            }
            else {
                newWords.push(thisWord);
                lastWord = thisWord;
            }
        }
        this.words = newWords;
    }


    fixOrder() {
        for (var i = this.words.length - 1; i >= 1; i--) {
            var nextWord = this.words[i];
            var word = this.words[i - 1];
            if (word.type == TOKEN.removed && nextWord.type == TOKEN.added) {
                if (Math.abs(nextWord.text.length - word.text.length) < 5) {

                    var dist = levenshtein(word.cleanText, nextWord.cleanText);
                    if (dist <= 2 && word.text.length > 3) {
                        nextWord.type = TOKEN.correct;
                        word.type = TOKEN.misspelling;

                        this.words.splice(i - 1, 0, nextWord);
                        this.words.splice(i + 1, 1);

                    }
                    else {
                        //word.type = TOKEN.replaced;
                    }
                    //this.words.splice(i, 0, word);
                    //this.words.splice(i + 1, 1);
                }
            }
        }
    }

    fixMovings() {
        for (var i = 0; i < this.words.length; i++) {
            var word = this.words[i];
            var nextWord = this.words[i + 1];
            if (word.type == TOKEN.movedFrom && !this.canMove(word)) {
                if (nextWord && word.cleanText == nextWord.cleanText && nextWord.type == TOKEN.added) {
                    nextWord.type = null;
                    i--;
                }
                else {
                    word.type = TOKEN.removed;
                }
                word.movedTo.type = TOKEN.added;
            }
        }
    }

    removeSameInsertRemoves() {
        for (var i = 0; i < this.words.length - 1; i++) {
            var word = this.words[i];
            var nextWord = this.words[i + 1];
            if (word.cleanText == nextWord.cleanText && word.type == TOKEN.removed && (nextWord.type == TOKEN.added || !nextWord.type)) {
                this.words.splice(i, 1);
                nextWord.type = null;
                i--;
            }
        }
    }

    fixOrder1() {
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
}

