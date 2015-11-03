import {posts} from "../posts/posts";
import {Post} from "./Post";
import {Store} from "../libs/Store";
export class PostStorage extends Store<Post> {
    constructor() {
        super();
        posts.map(rawPost => {
            const post = new Post(rawPost, true);
            this.push(post);
            this.push(...post.parts);
        });
    }
}
export const postStorage = new PostStorage();
