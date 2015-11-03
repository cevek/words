export class UserPost {
    revision = 0;
    serverRevision = 0;
    currentLine = 0;
    lines:{id: number; items: string[]}[] = [];

    constructor(public postId:string) {
    }
}