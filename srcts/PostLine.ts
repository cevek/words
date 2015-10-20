export class PostLine {
    id:string;
    partId:string;
    postId:string;
    origin:string;
    translate:string;

    constructor(id:string, postId:string, origin:string, translate:string) {
        this.id = id;
        this.postId = postId;
        this.origin = origin;
        this.translate = translate;
    }
}