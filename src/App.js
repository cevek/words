'use strict';
import React from 'react';
import {HTTP} from './http.js';
import {Sentence} from './Sentence.js';
import {vk} from './vk.js';

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
        this.postData = this.props.resolved.postData;
        this.userData = this.props.resolved.userData;
        this.fill();
        this.translate = this.getCurrentTranslate();
    }

    static resolve(params) {
        const postId = params.id;
        const http = new HTTP();
        return Promise.all([
            http.get('src/posts/' + postId.replace('-', '/') + '.json'),
            App.getUserData(postId)
        ]).then(([postData, userData]) => ({postData, userData}));
    }

    static getUserData(postId) {
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
        return vk.getKey(postId).then(data => {
            if (!data){
                return {currentLine: 0, lines: []};
            }
            return data;
        });
    }

    saveUserData() {
        localStorage[this.postId] = JSON.stringify(this.userData);
        return vk.setKey(this.postId, this.userData);
    }

    getCurrentOrigin() {
        return this.postData.data[this.currentLine][0];
    }

    getCurrentTranslate() {
        return this.postData.data[this.currentLine][1];
    }

    fill() {
        for (let i = 0; i < this.userData.currentLine; i++) {
            const line = this.userData.lines[i];
            this.sentences.push({
                origin: this.getCurrentOrigin(),
                originTranslate: this.getCurrentTranslate(),
                userTranslate: line
            });
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
        const line = this.userData.lines[this.currentLine] || (this.userData.lines[this.currentLine] = []);
        this.userData.currentLine += 1;
        const input = React.findDOMNode(this.refs.userText);
        line.push(input.value);
        input.value = '';
        window.scrollTo(0, 100000);
        this.saveUserData();

        this.sentences.push({
            origin: this.getCurrentOrigin(),
            originTranslate: this.getCurrentTranslate(),
            userTranslate: this.userData.lines[this.currentLine]
        });
        this.setNextSentence();
        this.translate = this.getCurrentTranslate();
        this.forceUpdate();
        return false;
    };

    onRestart = () => {
        this.currentLine = 0;
        this.userData.currentLine = 0;
        this.saveUserData();
        this.sentences = [];
        this.isDone = false;
        this.translate = this.getCurrentTranslate();
        this.forceUpdate();
    };

    render() {
        return <div className="app">
            <a href="#/">To main page</a>
            <svg/>
            <div className="items">
                {this.sentences.map(sentence =>
                    <SentenceBlock origin={sentence.origin} originTranslate={sentence.originTranslate}
                                   userTranslate={sentence.userTranslate}/>)}
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
            <div className="origin-translate">{this.props.originTranslate}</div>
            {this.props.userTranslate.map(userText =>
                <Sentence origin={this.props.origin} originTranslate={this.props.originTranslate}
                          userText={userText}/>)}
        </div>
    }
}


