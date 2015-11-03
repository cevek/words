import {postStorage} from "./PostStore";
import {PostLine} from "./PostLine";
import {Store} from "../libs/Store";

export class PostLineStorage extends Store<PostLine> {
    constructor() {
        super();
        this.fillItems();
        postStorage.listen(this.fillItems);
    }

    fillItems = () => {
        this.replaceAll([].concat(...postStorage.getItems().map(post => post.lines)));
    };
}
export const postLineStorage = new PostLineStorage();