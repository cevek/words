export class Post {
    revision:number;
    serverRevision:number;
    currentLine:number;
    lines:string[][];

    constructor(public postId:string) {
    }
}