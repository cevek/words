'use strict';
import React from 'react';
import {HTTP} from './http.js';
import {Sentence} from './Sentence.js';

// todo: the same keys => ..s, his-him-her, at-to-into, 1 sym mistake,
// todo: last the a is must be separatly

export class App extends React.Component {
    constructor(props) {
        super(props);
        this.postId = 'alissa';
        this.sentences = [];
        this.currentLine = 0;
        this.isDone = false;
        this.translate = '';
        this.render();

        this.postId = this.props.id;
        this.postData = this.props.resolved;
        this.fill();
        this.translate = this.getCurrentTranslate();

        this.load();
    }

    static resolve(params){
        const postId = params.id;
        const http = new HTTP();
        return http.get('src/posts/' + postId.replace('-', '/') + '.json');
    }

    load() {
        const postId = (location.hash.match(/\/post\/([\w\d\-]+)$/) || ['', ''])[1];
        this.postId = postId;

        this.http = new HTTP();
        this.http.get('../src/posts/' + postId.replace('-', '/') + '.json').then(data => {
            this.postData = data;
            this.fill();
            this.translate = this.getCurrentTranslate();
            this.forceUpdate();
        });
    }

    getUserData(postId) {
        let dt;
        try {
            const item = localStorage[postId];
            if (item) {
                dt = JSON.parse(item);
            }
        }
        catch (e) {
            console.error(e);
        }
        if (!dt) {
            dt = {currentLine: 0, lines: []};
        }
        return dt;
    }

    saveLine() {
        const data = this.getUserData(this.postId);
        const line = data.lines[this.currentLine] || (data.lines[this.currentLine] = []);
        data.currentLine += 1;
        const input = React.findDOMNode(this.refs.userText);;
        line.push(input.value);
        localStorage[this.postId] = JSON.stringify(data);
        input.value = '';
        window.scrollTo(0, 100000);
        return data;
    }

    getCurrentOrigin() {
        return this.postData.data[this.currentLine][0];
    }

    getCurrentTranslate() {
        return this.postData.data[this.currentLine][1];
    }

    fill() {
        const data = this.getUserData(this.postId);
        for (let i = 0; i < data.currentLine; i++) {
            const line = data.lines[i];
            this.sentences.push({origin: this.getCurrentOrigin(), userTranslate: line});
            this.setNextSentence();
        }
    }

    setNextSentence() {
        if (this.postData.data.length - 1 == this.currentLine) {
            this.isDone = true;
        }
        else {
            this.currentLine++;
        }
    }

    onSubmit = () => {
        const data = this.saveLine();
        //new SentenceBlock(this.items, this.svg, this.getCurrentOrigin(), data.lines[this.currentLine]);
        this.sentences.push({origin: this.getCurrentOrigin(), userTranslate: data.lines[this.currentLine]});
        this.setNextSentence();
        this.translate = this.getCurrentTranslate();
        this.forceUpdate();
        return false;
    };

    onRestart = () => {
        this.currentLine = 0;
        const data = this.getUserData(this.postId);
        data.currentLine = 0;
        localStorage[this.postId] = JSON.stringify(data);
        this.sentences = [];
        this.isDone = false;
        this.translate = this.getCurrentTranslate();
        this.forceUpdate();
    };

    render() {
        console.log(this.sentences);

        return <div className="app">
            <a href="#/">To main page</a>
            <svg/>
            <div className="items">
                {this.sentences.map(sentence =>
                    <SentenceBlock origin={sentence.origin} userTranslate={sentence.userTranslate}/>)}
            </div>
            {
                this.isDone ?
                    <div className="done">
                        <h1>Well Done!</h1>
                        <button onClick={this.onRestart}>Restart</button>
                    </div>
                    :
                    <form onSubmit={this.onSubmit}>
                        <div className="translate">{this.translate}</div>
                        <input ref="userText" className="text" type="text" required="true"/>
                    </form>
            }
        </div>
    }
}

class SentenceBlock extends React.Component {
    render() {
        return <div className="sentence-block">
            {this.props.userTranslate.map(userText =>
                <Sentence origin={this.props.origin} userText={userText}/>)}
        </div>
    }
}


