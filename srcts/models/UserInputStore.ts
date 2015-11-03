
import {Store} from "../libs/Store";
import {UserInput} from "./UserInput";
import {postStorage} from "./PostStore";
export class UserInputStore extends Store<UserInput> {
    autoIncrementId = 1;

    create(textId:number, text:string) {
        var userInput = new UserInput(this.autoIncrementId++, textId, text);
        this.push(userInput);
        return userInput;
    }

    @Store.inline
    getByPostId(postId:string) {
        return this.getBy(it=>it.postId, postId);
    }

    saveAll() {
        return Promise.all(this.getItems().map(userInput => userInput.save()));
    }

    getNextLineInPost(postId:string) {
        var post = postStorage.getById(postId);
        var lastUI = this.getByPostId(postId);
        return lastUI ? post.lines.indexOf(lastUI.postLine) + 1 : 0;
    }

    @Store.inline
    getAllByLineId(lineId:number) {
        return this.getAllBy(it => it.textId, lineId);
    }

    isLastInPost(postId:string) {
        return postStorage.getById(postId).lines.length == this.getNextLineInPost(postId);
    }
}
export var userInputStore = new UserInputStore();

