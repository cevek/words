'use strict';

class Word {
    constructor(text, keyMap) {
        this.text = text;
        this.setKey(keyMap);
    }

    setKey(keyMap) {
        var key = this.text.toLocaleLowerCase().replace(/[^\w\d]+/g, '');
        this.cleanText = key;

        while (keyMap[key]) {
            key += '*';
        }
        this.key = key;
        keyMap[key] = this;
    }
}

class SentenceBlock {
    constructor(parentNode, svgNode, originText, userTextLines) {
        var div = document.createElement('div');
        div.classList.add('sentence-block');
        parentNode.appendChild(div);
        for (var i = 0; i < userTextLines.length; i++) {
            var userText = userTextLines[i];
            new Sentence(div, svgNode, originText, userText);
        }
    }
}

var arrowRenderQueue = [];
class Sentence {
    constructor(parentNode, svgNode, originText, userText) {
        this.originText = originText;
        this.parentNode = parentNode;
        this.svgNode = svgNode;
        this.userText = userText;
        this.words = new WordProcessor(originText, userText).words;
        this.renderLine();
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

    renderArrow(arrow) {
        var xmlns = "http://www.w3.org/2000/svg";
        var fromBounds = arrow.from.dom.getBoundingClientRect();
        var toBounds = arrow.to.dom.getBoundingClientRect();

        //requestAnimationFrame(() => {
            var paths = this.generateArrowPath(fromBounds.top + window.scrollY, fromBounds.left + fromBounds.width / 2 | 0, toBounds.left + toBounds.width / 2 | 0);
            var pathNode = document.createElementNS(xmlns, 'path');
            pathNode.setAttribute('d', paths[1]);
            pathNode.setAttribute('class', 'line');
            this.svgNode.appendChild(pathNode);

            var arrowNode = document.createElementNS(xmlns, 'path');
            arrowNode.setAttribute('d', paths[0]);
            arrowNode.setAttribute('class', 'arrow');
            this.svgNode.appendChild(arrowNode);
        //});
    }


    renderLine() {
        var node = document.createElement('div');
        node.classList.add('line');
        this.parentNode.appendChild(node);
        //console.log(this.originText, " ******** ", this.userText, this.words);

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
        if (arrows.length) {
            requestAnimationFrame(() => {
                for (var i = 0; i < arrows.length; i++) {
                    this.renderArrow(arrows[i]);
                }
            });
        }
    }
}

