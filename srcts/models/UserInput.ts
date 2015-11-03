import {PostLine} from "./PostLine";
import {Store} from "./../libs/Store";
import {shardStore} from "./../models/ShardStore";
import {postLineStorage} from "./../models/PostLineStore";

export type UserInputJSON = [number, number, string, number, number];
export class UserInput {
    public postId:string;
    public postLine:PostLine;
    public duration:number;
    public addedAt:Date;

    constructor(public id:number, public textId:number, public text:string) {
        this.postLine = postLineStorage.getById(textId);
        this.postId = this.postLine.postId;
        shardStore.getShard(id).addUserText(this);
    }

    save() {
        return shardStore.getShard(this.id).save();
    }

    toJson():UserInputJSON {
        return [this.id, this.textId, this.text, this.duration, this.addedAt.getTime() / 1000];
    }

    static fromJson(json:UserInputJSON) {
        var userInput = new UserInput(json[0], json[1], json[2]);
        userInput.duration = json[3];
        userInput.addedAt = new Date(json[4] * 1000);
        return userInput;
    }
}
