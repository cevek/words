import {Component} from "./Component";
import * as React from "react";
import {HTTP} from './http';
import {Sentence} from './Sentence';
import {storage} from './storage';
import {Post} from "./Post";
import {RealPost} from "./RealPost";
import {findPartById, Part, posts} from "./posts/posts";
import {WordProcessor} from "./WordProcessor";

// todo: the same keys => ..s, his-him-her, at-to-into, 1 sym mistake,
// todo: last the a is must be separatly

interface WordSentence {
    origin:string;
    originTranslate:string;
    userTranslate:string[];
    key?:string;
}

export class App extends Component<{params: {id: string}; resolved: {postData:RealPost}}> {
    userData:Post;
    postId = this.props.params.id;
    sentences:WordSentence[] = [];
    currentLine = 0;
    isDone = false;
    translate = '';
    postData:Part;

    constructor(props:any) {
        super(props);
        this.render();

        this.postData = findPartById(this.postId);
        this.userData = storage.get(this.postId);
        this.fill();
    }

    componentWillReceiveProps() {
        this.userData = storage.get(this.postId);
        this.fill();
    }

    saveUserData() {
        return storage.set(this.postId, this.userData);
    }

    getCurrentOrigin() {
        return this.postData.data[this.currentLine][0];
    }

    getCurrentTranslate() {
        return this.postData.data[this.currentLine][1];
    }

    fill() {
        this.sentences = [];
        this.currentLine = 0;
        for (let i = 0; i < this.userData.currentLine; i++) {
            const line = this.userData.lines[i];
            this.sentences.push({
                origin: this.getCurrentOrigin(),
                originTranslate: this.getCurrentTranslate(),
                userTranslate: line
            });
            this.setNextSentence();
        }
        this.translate = this.getCurrentTranslate();
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
        const input = React.findDOMNode(this.refs['userText']) as HTMLInputElement;
        const wordProcessor = new WordProcessor(this.getCurrentOrigin(), input.value);
        this.inputErrorsCount = wordProcessor.errorsCount;
        if (!this.showError && this.inputErrorsCount > 0) {
            this.showError = true;
            this.forceUpdate();
            return false;
        }
        this.showError = false;

        const line = this.userData.lines[this.currentLine] || (this.userData.lines[this.currentLine] = []);
        this.userData.currentLine += 1;
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

    onInput = ()=> {
        this.showError = false;
        this.forceUpdate();
    };

    inputErrorsCount = 0;
    showError = false;

    render() {
        return <div className="app">
            <a href="#/">To main page</a>
            <svg/>
            <div className="items">
                {this.sentences.map(sentence =>
                <SentenceBlock key={sentence.originTranslate} origin={sentence.origin}
                               originTranslate={sentence.originTranslate}
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
                    <input ref="userText" onInput={this.onInput} className="text" type="text" required/>
                    {
                        this.showError
                            ?
                        <div className="errors-count">
                            There {this.inputErrorsCount == 1 ? `is 1 error` : `are ${this.inputErrorsCount} errors`}, press Enter to continue
                        </div>
                            : null

                        }
                </form>
                }
        </div>
    }
}

class SentenceBlock extends Component<WordSentence> {
    render() {
        return <div className="sentence-block">
            <div className="origin-translate">{this.props.originTranslate}</div>
            {this.props.userTranslate.map(userText =>
            <Sentence key={userText} origin={this.props.origin} userText={userText}/>)}
        </div>
    }
}


