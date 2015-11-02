import {Component} from "./Component";
import * as React from "react";
import {HTTP} from './http';
import {Sentence} from './Sentence';
import {storage, UserInput, userInputStore} from './storage';
import {UserPost} from "./UserPost";
import {RealPost} from "./RealPost";
import {Post, postStorage, postLineStorage} from "./posts/posts";
import {WordProcessor} from "./WordProcessor";
import {PostLine} from "./PostLine";

interface WordSentence {
    postLine: PostLine;
    userTranslate:UserInput[];
    key?:number | string;
}

export class App extends Component<{params: {id: string}; resolved: {postData:RealPost}}> {
    postId = this.props.params.id;
    sentences:WordSentence[] = [];
    isDone = false;
    postData:Post;

    constructor(props:any) {
        super(props);
        this.postData = postStorage.getById(this.postId);
        this.fill();
        this.render();
    }

    saveUserData() {
        //todo: return promise
    }

    getCurrentLine() {
        var lastLineN = userInputStore.getNextLineInPost(this.postId);
        return this.postData.lines[lastLineN];
    }

    addSentence(postLine:PostLine) {
        this.sentences.push({
            postLine: postLine,
            userTranslate: userInputStore.getAllByLineId(postLine.id)
        });
        if (userInputStore.isLastInPost(this.postId)) {
            this.isDone = true;
        }
    }

    fill() {
        this.sentences = [];

        var post = postStorage.getById(this.postId);
        var max = userInputStore.getNextLineInPost(this.postId);
        for (var i = 0; i < max; i++) {
            var postLine = post.lines[i];
            this.addSentence(postLine);
        }
    }

    setNextSentence() {
        if (userInputStore.isLastInPost(this.postId)) {
            this.isDone = true;
        }
    }

    onSubmit = () => {
        const input = React.findDOMNode(this.refs['userText']) as HTMLInputElement;
        const wordProcessor = new WordProcessor(this.getCurrentLine().origin, input.value);
        this.inputErrorsCount = wordProcessor.errorsCount;
        if (!this.showError && this.inputErrorsCount > 0) {
            this.showError = true;
            this.forceUpdate();
            return false;
        }
        this.showError = false;
        userInputStore.create(this.getCurrentLine().id, input.value);
        input.value = '';
        window.scrollTo(0, 100000);
        this.saveUserData();
        this.addSentence(this.getCurrentLine());

        this.forceUpdate();
        return false;
    };

    onRestart = () => {
        this.saveUserData();
        this.sentences = [];
        this.isDone = false;
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
                <SentenceBlock key={sentence.postLine.id} postLine={sentence.postLine}
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
                    <div className="translate">{this.getCurrentLine().translate}</div>
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
            <div className="origin-translate">{this.props.postLine.translate}</div>
            {this.props.userTranslate.map(userText =>
            <Sentence key={userText.id} postLine={this.props.postLine} userText={userText}/>)}
        </div>
    }
}


