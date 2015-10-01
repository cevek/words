'use strict';

import {TOKEN} from './Token.js';
import {sync, levenshtein} from './lis.js';
import {Word} from './Sentence.js';

//todo: the same keys => ..s, his-him-her, at-to-into, 1 sym mistake,
//todo: last the a is must be separatly

function prepareRules(rules) {
    const blocks = rules.split('|');
    const map = {};
    for (let i = 0; i < blocks.length; i++) {
        const words = blocks[i].split(',');
        const blockMap = {};
        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            blockMap[word] = true;
            map[word] = blockMap;
        }
    }
    return map;
}
function prepareNoMoved(rule) {
    const words = rule.split(',');
    const blockMap = {};
    for (let j = 0; j < words.length; j++) {
        const word = words[j];
        blockMap[word] = true;
    }
    return blockMap;
}
const noMovedWords = prepareNoMoved('a,the,are,is,do,on,in,at');
const rules = prepareRules('a,the|are,is|dinner,lunch|every,each|his,her,him|big,large');


export class WordProcessor {
    constructor(originText, userText) {
        this.originText = originText;
        this.userText = userText;
        this.words = this.parseWords(userText);
        const originWords = this.parseWords(originText);

        this.words = this.prepareSync(this.words, originWords);
        //this.modify();
        //this.fixO§rder();
        //this.merge();
        //this.fixMovings();
        //this.removeSameInsertRemoves();
    }

    tryToReplace(added, removed) {
        if (rules[added.cleanText] && rules[removed.cleanText] === rules[added.cleanText]
            || levenshtein(added.cleanText, removed.cleanText) <= 2) {
            //console.log('replace', added, removed);
            added.replaced = removed;
            removed.excluded = true;
            return false;
        }
        return false;
    }


    compareWords(a, b) {
        return a.key === b.key;
    }

    modify(syncResult, userWords) {
        const newUserWords = userWords.slice();
        newUserWords.keyMap = userWords.keyMap;

        for (let i = 0; i < syncResult.length; i++) {
            const block = syncResult[i];
            if (block.type == TOKEN.added) {
                const word = block.node;
                word.type = TOKEN.added;
                if (block.next) {
                    const pos = newUserWords.findIndex(w => w.key == block.next.key);
                    newUserWords.splice(pos, 0, word);
                }
                else {
                    newUserWords.push(word);
                }
            }

            if (block.type == TOKEN.removed) {
                const word = block.node;
                word.type = TOKEN.removed;
            }

            if (block.type == TOKEN.moved) {
                const word = newUserWords.find(w => w.key == block.node.key);
                let pos = newUserWords.length;
                if (block.next) {
                    pos = newUserWords.findIndex(w => w.key == block.next.key);
                }
                const newWord = new Word(block.node.text, newUserWords.keyMap);
                newWord.movedFrom = word;

                const canMove = !noMovedWords[newWord.cleanText];

                newWord.type = canMove ? TOKEN.movedTo : TOKEN.added;
                newWord.key = word.key;
                newUserWords.splice(pos, 0, newWord);
                //todo
                word.key += '*';
                word.type = canMove ? TOKEN.movedFrom : TOKEN.removed;
                word.movedTo = newWord;
                //return {word: word, pos: pos, newWord: newWord};
            }
        }
        return newUserWords;
    }


    prepareSync(userWords, originWords) {
        const newWords = this.modify(sync(userWords, originWords, this.compareWords), userWords);
        let mergedCount = 0;
        let removedAddedPartStartPos = -1;

        for (let i = 0; i < newWords.length; i++) {
            const word = newWords[i];
            if (word.type == TOKEN.added || word.type == TOKEN.removed) {
                if (removedAddedPartStartPos == -1) {
                    removedAddedPartStartPos = i;
                }
            }
            else {
                removedAddedPartStartPos = -1;
            }

            if (word.type == TOKEN.added && !word.replaced) {
                //console.log('removed', word);
                let j = removedAddedPartStartPos;
                while (true) {
                    const nextWord = newWords[j++];
                    if (!nextWord) {
                        break;
                    }
                    if (nextWord.type == TOKEN.added) {
                        continue;
                    }
                    if (nextWord.type == TOKEN.removed) {
                        if (nextWord.excluded) {
                            continue;
                        }
                        if (this.tryToReplace(word, nextWord)) {
                            mergedCount++;
                            break;
                        }
                    }
                    else {
                        break;
                    }
                }
            }
        }
        if (mergedCount > 0) {
            return this.prepareSync(userWords, originWords);
        }
        return this.filter(newWords);
    }

    filter(words) {
        const newWords = [];
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word.excluded || word.cleanText == '') {
                continue;
            }
            if (word.replaced) {
                word.type = TOKEN.replaced;
                if (word.replaced.cleanText == word.cleanText) {
                    word.replaced = null;
                    word.type = null;
                }
            }
            newWords.push(word);
        }
        return newWords;
    }


    parseWords(str) {
        const keyMap = {};
        const wordChunks = this.prepareStr(str).split(/ /);

        const words = [];
        for (let i = 0; i < wordChunks.length; i++) {
            words.push(new Word(wordChunks[i], keyMap));
        }
        words.keyMap = keyMap;
        return words;
    }

    prepareStr(s) {
        let str = s.trim();
        str = str.replace(/\b(are|did|do|does|could|had|have|has|is|might|may|must|was|were|would) ?not\b/ig, '$1n’t');
        str = str.replace(/\bcan ?not\b/ig, 'can’t');
        str = str.replace(/\b(You|we|they) (are)\b/ig, '$1’re');
        str = str.replace(/\b(I|he|she|they|we|you) (had)\b/ig, '$1’d');
        str = str.replace(/\b(I|they|we|you) have\b/ig, '$1’ve');
        str = str.replace(/\b(it|he|she|here|that|there|what) is\b/ig, '$1’s');
        str = str.replace(/\bI\b/ig, 'I');
        str = str.replace(/\b(I) am\b/ig, '$1’m');
        str = str.replace(/\b(W)ill not\b/ig, '$1on’t');
        str = str.replace(/\b(let) us\b/ig, '$1’s');
        str = str.replace(/\b(I|you|he|she|it|we|they|that) will\b/ig, '$1’ll');
        str = str.replace(/'/ig, '’');
        str = str.replace(/,/ig, ', ');
        str = str.replace(/(-|–|—) +/ig, ' $1\u00A0');
        str = str.replace(/\s+/g, ' ');
        //str = str[0].toUpperCase() + str.slice(1);
        return str.trim();
    }


    canMove(word) {
        return !word.cleanText.match(/^(a|the|and|to)$/);
    }

    merge() {
        let lastWord = this.words[0];
        const newWords = [];
        newWords.push(lastWord);
        for (let i = 1; i < this.words.length; i++) {
            const prevWord = this.words[i - 1];
            const thisWord = this.words[i];
            let merge = false;

            if (prevWord.type == TOKEN.movedFrom && thisWord.type == TOKEN.movedFrom) {
                const to1Pos = this.words.indexOf(prevWord.movedTo);
                const to2Pos = this.words.indexOf(thisWord.movedTo);
                if (to1Pos == to2Pos - 1) {
                    merge = true;
                }
            }
            else if (prevWord.type == TOKEN.movedTo && thisWord.type == TOKEN.movedTo) {
                const from1Pos = this.words.indexOf(prevWord.movedFrom);
                const from2Pos = this.words.indexOf(thisWord.movedFrom);
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
        for (let i = this.words.length - 1; i >= 1; i--) {
            const nextWord = this.words[i];
            const word = this.words[i - 1];
            if (word.type == TOKEN.removed && nextWord.type == TOKEN.added) {
                if (Math.abs(nextWord.text.length - word.text.length) < 5) {

                    const dist = levenshtein(word.cleanText, nextWord.cleanText);
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
        for (let i = 0; i < this.words.length; i++) {
            const word = this.words[i];
            const nextWord = this.words[i + 1];
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
        for (let i = 0; i < this.words.length - 1; i++) {
            const word = this.words[i];
            const nextWord = this.words[i + 1];
            if (word.cleanText == nextWord.cleanText && word.type == TOKEN.removed && (nextWord.type == TOKEN.added || !nextWord.type)) {
                this.words.splice(i, 1);
                nextWord.type = null;
                i--;
            }
        }
    }

    fixOrder1() {
        for (let i = 0; i < this.words.length - 1; i++) {
            const word = this.words[i];
            const nextWord = this.words[i + 1];
            if (word.type == TOKEN.removed && nextWord.type == TOKEN.added) {
                if ((word.text.length - nextWord.text.length) > -5) {
                    const dist = levenshtein(nextWord.key, word.key);
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

    print() {
        console.log(this.words.map(w => {
            //console.log(w);

            let s = '';
            if (w.type == TOKEN.added) {
                s += '+' + w.cleanText;
            }
            else if (w.type == TOKEN.removed) {
                s += '-' + w.cleanText;
            }
            else if (w.type == TOKEN.movedFrom) {
                s += '' + w.cleanText + '~>';
            }
            else if (w.type == TOKEN.movedTo) {
                s += '~>' + w.cleanText;
            }
            else {
                s += w.cleanText
            }

            if (w.replaced) {
                s += '(' + w.replaced.cleanText + ')';
            }

            return s;
        }).join(','), ' / ', this.originText, ' / ', this.userText);
    }
}

