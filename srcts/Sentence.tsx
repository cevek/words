import * as React from 'react';
import {TOKEN} from './Token';
import * as classNames from 'classnames';
import {WordProcessor} from './WordProcessor';
import {Component} from "./Component";
import {Word} from "./WordProcessor";

export class Sentence extends Component<{origin: string; userText: string;}> {
    /*constructor(parentNode, svgNode, originText, userText) {
     this.originText = originText;
     this.parentNode = parentNode;
     this.svgNode = svgNode;
     this.userText = userText;
     this.words = new WordProcessor(originText, userText).words;
     this.renderLine();
     }*/
    words: Word[];

    generateArrowPath(y:number, from:number, to:number) {
        const height = 20;
        const arrowSize = 5;
        let fromShift = 0;
        let toShift = 0;
        let left = 0;
        let right = 0;
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

    /*renderArrow(arrow) {
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
    }*/

    render() {
        const wordProcessor = new WordProcessor(this.props.origin, this.props.userText);
        wordProcessor.print();
        this.words = wordProcessor.words;

        return <div className="line">
            {this.words.map((word:Word) => {
                let userWord = word.text.trim();
                if (word.replacedWith) {
                    var originWord = <span className="original">{word.replacedWith.text.trim()}</span>;
                }

                var types:string[] = [];
                switch (word.type){
                    case TOKEN.added: types.push('added'); break;
                    case TOKEN.removed: types.push('removed'); break;
                    }
                if (word.movedFrom){
                    types.push('moved-to');
                    }
                if (word.movedTo){
                    types.push('moved-from');
                    }
                if (word.replacedWith){
                    types.push('replaced');
                    }


                return [<span className={classNames(types)}>
                    {originWord}
                    {userWord}
                </span>, ' ']
            })}
        </div>
    }

    /*renderLine() {
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
    }*/
}

