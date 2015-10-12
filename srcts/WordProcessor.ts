'use strict';

import {TOKEN} from './Token';
import {sync, SyncResult, levenshtein} from './lis';

let SyncTypes = {
    added: 'added',
    removed: 'removed',
    moved: 'moved',
};

//todo: the same keys => ..s, his-him-her, at-to-into, 1 sym mistake,
//todo: last the a is must be separatly

function prepareRules(rules:string) {
    const blocks = rules.split('|');
    const map:{[index: string]: {[index:string]:boolean}} = {};
    for (let i = 0; i < blocks.length; i++) {
        const words = blocks[i].split(',');
        const blockMap:{[index:string]:boolean} = {};
        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            blockMap[word] = true;
            map[word] = blockMap;
        }
    }
    return map;
}
function prepareNoMoved(rule:string) {
    const words = rule.split(',');
    const blockMap:{[index:string]:boolean} = {};
    for (let j = 0; j < words.length; j++) {
        const word = words[j];
        blockMap[word] = true;
    }
    return blockMap;
}
const noMovedWords = prepareNoMoved('a,the,are,is,do,on,in,at');
const rules = prepareRules('a,the|are,is|dinner,lunch|every,each|his,her,him|big,large');

export class Word {
    key:string;
    cleanText:string;
    type:TOKEN;
    replacedWith:Word;
    replaceFor:Word;
    replaceFor:Word;
    excluded:boolean;
    movedFrom:Word;
    movedTo:Word;
    original:boolean;

    constructor(public text:string, public userWords:Word[]) {
        this.setKey();
    }

    setKey() {
        let key = this.text.toLocaleLowerCase().replace(/[^\w\d]+/g, '');
        this.cleanText = key;

        while (this.userWords.filter(w => w.key == key).length > 0) {
            key += '*';
        }
        this.key = key;
    }
}

export class WordProcessor {
    words:Word[];
    errorsCount = 0;

    constructor(public originText:string, public userText:string) {
        this.words = this.parseWords(userText, true);
        const originWords = this.parseWords(originText);

        this.words = this.prepareSync(this.words, originWords);
        this.calcErrors();
        //this.modify();
        //this.fixO§rder();
        //this.merge();
        //this.fixMovings();
        //this.removeSameInsertRemoves();
    }

    tryToReplace(added:Word, removed:Word) {
        if (rules[added.cleanText] && rules[removed.cleanText] === rules[added.cleanText]
            || levenshtein(added.cleanText, removed.cleanText) <= 2) {
            //console.log('replace', added, removed);
            removed.type = null;
            added.type = null;

            removed.key = added.key;
            //removed.movedTo = added;
            removed.replacedWith = added;
            added.replaceFor = removed;

            //removed.excluded = true;
            return true;
        }
        return false;
    }

    compareWords(a:Word, b:Word) {
        return a.key === b.key;
    }

    modify(syncResult:SyncResult<Word>[], userWords:Word[]) {
        const newUserWords = userWords.slice();

        for (var i = 0; i < syncResult.length; i++) {
            var block = syncResult[i];
            if (block.type == SyncTypes.added) {
                const word = block.node;
                word.type = TOKEN.added;
                if (block.next) {
                    const pos = newUserWords.findIndex(w => w.key == block.next.key && !w.movedTo);
                    if (pos == -1) {
                        throw "Pos -1";
                    }
                    newUserWords.splice(pos, 0, word);
                }
                else {
                    newUserWords.push(word);
                }
            }

            if (block.type == SyncTypes.removed) {
                const word = block.node;
                word.type = TOKEN.removed;
            }

            if (block.type == SyncTypes.moved) {
                var origWord = block.node;
                if (block.next) {
                    const pos = newUserWords.findIndex(w => w.key == block.next.key && !w.movedTo);
                    if (pos == -1) {
                        throw "Pos -1";
                    }
                    newUserWords.splice(pos, 0, origWord);
                }
                else {
                    newUserWords.push(origWord);
                }
                origWord.type = null;

                const userWord = newUserWords.find(w => w.key == origWord.key && !w.original);
                userWord.type = null;

                const canMove = !noMovedWords[origWord.cleanText];
                if (canMove) {
                    origWord.movedFrom = userWord;
                    userWord.movedTo = origWord;
                }
                else {
                    //origWord.type = TOKEN.added;
                    userWord.type = TOKEN.removed;
                }

                //userWord.type = TOKEN.movedFrom;
                //userWord.movedFrom = block.node;

                /*
                 let pos = newUserWords.length;
                 if (block.next) {
                 pos = newUserWords.findIndex(w => w.key == block.next.key && !block.next.movedFrom);
                 }
                 const newWord = new Word(block.node.text, newUserWords.keyMap);
                 newWord.movedFrom = word;

                 const canMove = !noMovedWords[newWord.cleanText];
                 newWord.type = canMove ? TOKEN.movedTo : TOKEN.added;
                 //newWord.key = word.key;
                 //newUserWords.splice(pos, 0, newWord);
                 //todo
                 //word.key = Math.random();
                 word.type = canMove ? TOKEN.movedFrom : TOKEN.removed;
                 word.movedTo = newWord;
                 */
                //return {word: word, pos: pos, newWord: newWord};
            }
        }
        for (let i = 0; i < newUserWords.length; i++) {
            const word = newUserWords[i];

            //const canMove = !noMovedWords[newWord.cleanText];
            //newWord.type = canMove ? TOKEN.movedTo : TOKEN.added;

        }
        return newUserWords;
    }

    prepareSync(userWords:Word[], originWords:Word[]):Word[] {
        //console.log(userWords, originWords);

        const newWords = this.modify(sync(userWords, originWords, this.compareWords), userWords);

        let mergedCount = 0;
        let removedAddedPartStartPos = -1;

        //we try to find removed pair for added in the ([added|removed|movedFrom]*) parts
        for (let i = 0; i < newWords.length; i++) {
            const word = newWords[i];
            //todo: check movedFrom

            //start ([added|removed|movedFrom]*) position
            if (word.type == TOKEN.added || word.type == TOKEN.removed || word.movedFrom) {
                if (removedAddedPartStartPos == -1) {
                    removedAddedPartStartPos = i;
                }
            }
            else {
                removedAddedPartStartPos = -1;
            }

            // find only added words
            if (word.type == TOKEN.added && !word.replaceFor) {
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
                    // find removed pair
                    if (nextWord.type == TOKEN.removed && !word.replacedWith) {
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
        //in finally we try to find pair(added,removed) in other parts of the sentence
        for (let i = 0; i < newWords.length; i++) {
            const word = newWords[i];
            if (word.type == TOKEN.added && !word.replaceFor) {
                for (let j = 0; j < newWords.length; j++) {
                    const word2 = newWords[j];
                    if (word2.type == TOKEN.removed && !word2.replacedWith) {
                        if (this.tryToReplace(word, word2)) {
                            mergedCount++;
                        }
                        break;
                    }
                }
            }
        }

        //console.log(mergedCount, "mergedCount");
        // if we have merged pairs try again
        if (mergedCount > 0) {
            return this.prepareSync(userWords, originWords);
        }
        return this.filter(newWords);
    }

    filter(words:Word[]) {
        const newWords:Word[] = [];
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word.cleanText == '') {
                continue;
            }
            // if the replaced word is same with word
            if (word.replacedWith) {
                word.type = TOKEN.replacedWith;
                if (word.replacedWith.cleanText == word.cleanText) {
                    word.replacedWith = null;
                    word.type = null;
                }
            }
            // set moved flag to added & replaced words
            if (word.replaceFor) {
                word.movedFrom = word.replaceFor;
                word.replaceFor.movedTo = word;
            }
            newWords.push(word);
        }
        return newWords;
    }

    calcErrors() {
        var errors  = 0;
        for (var i = 0; i < this.words.length; i++) {
            var w = this.words[i];
            let s = '';
            if (w.type == TOKEN.added) {
                errors++;
            }
            if (w.type == TOKEN.removed) {
                errors++;
            }

            if (w.replacedWith) {
                errors++;
            }
            if (w.movedTo) {
                errors++;
            }
        }
        this.errorsCount = errors;
    }

    parseWords(str:string, isUserText = false) {
        const wordChunks = this.prepareStr(str).split(/ /);

        const words:Word[] = [];
        for (let i = 0; i < wordChunks.length; i++) {
            var word = new Word(wordChunks[i], words);
            word.original = !isUserText;
            words.push(word);
        }
        return words;
    }

    prepareStr(s:string) {
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
        str = str.replace(/\s+/g, ' ');
        str = str.replace(/(-|–|—) +/ig, ' $1\u00A0');
        //str = str[0].toUpperCase() + str.slice(1);
        return str.trim();
    }

    canMove(word:Word) {
        return !word.cleanText.match(/^(a|the|and|to)$/);
    }

    merge() {
        let lastWord = this.words[0];
        const newWords:Word[] = [];
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

    /*fixOrder1() {
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
    }*/

    print() {
        console.log(this.words.map(w => {
            //console.log(w);

            let s = '';
            if (w.movedFrom) {
                s += '~>';
            }
            if (w.type == TOKEN.added) {
                s += '+';
            }
            if (w.type == TOKEN.removed) {
                s += '-';
            }
            s += w.cleanText;

            if (w.replacedWith) {
                s += '(' + w.replacedWith.cleanText + ')';
            }
            if (w.movedTo) {
                s += '~>';
            }

            return s;
        }).join(','), ' pp(\'' + this.originText + '\', \'' + this.userText + '\')'/*,this.words*/);
    }
}


