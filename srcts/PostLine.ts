export class PostLine {
    id:number;
    partId:string;
    postId:string;
    origin:string;
    translate:string;

    constructor(id:number, postId:string, origin:string, translate:string) {
        this.id = id;
        this.postId = postId;
        this.origin = origin;
        this.translate = translate;
    }
}