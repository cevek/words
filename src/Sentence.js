import React from 'react';
import {TOKEN} from './Token.js';
import classNames from 'classnames';
import {WordProcessor} from './WordProcessor.js';

export class Word {
    constructor(text, keyMap) {
        this.text = text;
        this.setKey(keyMap);
    }

    setKey(keyMap) {
        let key = this.text.toLocaleLowerCase().replace(/[^\w\d]+/g, '');
        this.cleanText = key;

        while (keyMap[key]) {
            key += '*';
        }
        this.key = key;
        keyMap[key] = this;
    }
}

export class Sentence extends React.Component {
    /*constructor(parentNode, svgNode, originText, userText) {
     this.originText = originText;
     this.parentNode = parentNode;
     this.svgNode = svgNode;
     this.userText = userText;
     this.words = new WordProcessor(originText, userText).words;
     this.renderLine();
     }*/

    generateArrowPath(y, from, to) {
        const height = 20;
        const arrowSize = 5;
        let fromShift = 0;
        let toShift = 0;
        let left;
        let right;
        if (from < to) {
            right = to;
            left = from;
            toShift = arrowSize;
        }
        else {
            right = from;
            left = to;
            fromShift = arrowSize;
        }
        const top = y - height;
        return [
            `M${to - arrowSize},${y - arrowSize} h${arrowSize * 2} l-${arrowSize},${arrowSize} Z`,
            `M${left},${y - fromShift} C${left},${top} ${right},${top} ${right},${y - toShift}`
        ];
    }

    renderArrow(arrow) {
        const xmlns = 'http://www.w3.org/2000/svg';
        const fromBounds = arrow.from.dom.getBoundingClientRect();
        const toBounds = arrow.to.dom.getBoundingClientRect();

        //requestAnimationFrame(() => {
        const paths = this.generateArrowPath(fromBounds.top + window.scrollY, fromBounds.left + fromBounds.width / 2 | 0, toBounds.left + toBounds.width / 2 | 0);
        const pathNode = document.createElementNS(xmlns, 'path');
        pathNode.setAttribute('d', paths[1]);
        pathNode.setAttribute('class', 'line');
        this.svgNode.appendChild(pathNode);

        const arrowNode = document.createElementNS(xmlns, 'path');
        arrowNode.setAttribute('d', paths[0]);
        arrowNode.setAttribute('class', 'arrow');
        this.svgNode.appendChild(arrowNode);
        //});
    }

    render() {
        const wordProcessor = new WordProcessor(this.props.origin, this.props.userText);
        wordProcessor.print();
        this.words = wordProcessor.words;

        return <div className="line">
            {this.words.map(word => {
                let userWord = word.text.trim();
                let originWord;
                if (word.replaced) {
                    originWord = <span className="original">{word.text.trim()}</span>;
                    userWord = word.replaced.text.trim();
                }

                return [<span className={classNames(word.type ? [TOKEN.token, word.type] : null)}>
                    {originWord}
                    {userWord}
                </span>, ' ']
            })}
        </div>
    }

    renderLine() {
        const node = document.createElement('div');
        node.classList.add('line');
        this.parentNode.appendChild(node);
        //console.log(this.originText, " ******** ", this.userText, this.words);

        const arrows = [];
        for (let i = 0; i < this.words.length; i++) {
            const word = this.words[i];
            const span = document.createElement('span');
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
                for (let i = 0; i < arrows.length; i++) {
                    this.renderArrow(arrows[i]);
                }
            });
        }
    }
}

