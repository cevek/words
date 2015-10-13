export class Post {
    revision = 0;
    serverRevision = 0;
    currentLine = 0;
    lines:{id: string; items: string[]}[] = [];

    constructor(public postId:string) {
    }
}