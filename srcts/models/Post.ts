import {Store} from "./../libs/Store";
import {PostLine} from "./PostLine";
import {posts, RawPost} from "./../posts/posts";
export class Post {
    id:string;
    title:string;
    parts:Post[];
    lines:PostLine[];
    isTop:boolean;

    constructor(rawPost:RawPost, isTop:boolean) {
        this.isTop = isTop;
        this.id = rawPost.id;
        this.title = rawPost.title;
        if (rawPost.rawData) {
            this.lines = rawPost.rawData.map(item => new PostLine(item[0], this.id, item[1], item[2]));
        }
        if (rawPost.parts) {
            this.parts = rawPost.parts.map(rawPost => new Post(rawPost, false));
        }
    }
}
