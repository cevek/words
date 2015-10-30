import {PostLine} from "../PostLine";
import {UserPost} from "../UserPost";
import {Store} from "../Store";
type RawData = [number, string, string][];
type RawPost = {id: string; title: string; rawData?: RawData, parts?: RawPost[]};
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
const nextId = 352;

const posts:RawPost[] = [
    {
        "id": "alissa",
        "title": "Alissa",
        "parts": [
            {"id": "alissa-1", "title": "Part1", "rawData": require<RawData>("json!./alissa/1.json")},
            {"id": "alissa-2", "title": "Part2", "rawData": require<RawData>("json!./alissa/2.json")},
            {"id": "alissa-3", "title": "Part3", "rawData": require<RawData>("json!./alissa/3.json")},
            {"id": "alissa-4", "title": "Part4", "rawData": require<RawData>("json!./alissa/4.json")},
            {"id": "alissa-5", "title": "Part5", "rawData": require<RawData>("json!./alissa/5.json")},
        ],
    },
    {
        "id": "sara",
        "title": "Sara",
        "parts": [
            {"id": "sara-1", "title": "Part1", "rawData": require<RawData>("json!./sara/1.json")},
            {"id": "sara-2", "title": "Part2", "rawData": require<RawData>("json!./sara/2.json")},
            {"id": "sara-3", "title": "Part3", "rawData": require<RawData>("json!./sara/3.json")},
            {"id": "sara-4", "title": "Part4", "rawData": require<RawData>("json!./sara/4.json")},
            {"id": "sara-5", "title": "Part5", "rawData": require<RawData>("json!./sara/5.json")},
            {"id": "sara-6", "title": "Part6", "rawData": require<RawData>("json!./sara/6.json")},
            {"id": "sara-7", "title": "Part7", "rawData": require<RawData>("json!./sara/7.json")},
        ]
    },
    {
        "id": "luckynumber",
        "title": "Lucky Number",
        "parts": [
            {"id": "luckynumber-1", "title": "Part1", "rawData": require<RawData>("json!./luckynumber/1.json")},
            //{"id": "luckynumber-2", "title": "Part2", "rawData": require<RawData>("json!./sara/2.json")},
            //{"id": "luckynumber-3", "title": "Part3", "rawData": require<RawData>("json!./sara/3.json")},
            //{"id": "luckynumber-4", "title": "Part4", "rawData": require<RawData>("json!./sara/4.json")},
            //{"id": "luckynumber-5", "title": "Part5", "rawData": require<RawData>("json!./sara/5.json")},
            //{"id": "luckynumber-6", "title": "Part6", "rawData": require<RawData>("json!./sara/6.json")},
            //{"id": "luckynumber-7", "title": "Part7", "rawData": require<RawData>("json!./sara/7.json")},
        ]
    },
    {
        "id": "animal",
        "title": "Animal Life Cycles",
        "parts": [
            {"id": "animal-1", "title": "Part1", "rawData": require<RawData>("json!./animal/1.json")},
            {"id": "animal-2", "title": "Part2", "rawData": require<RawData>("json!./animal/2.json")},
            {"id": "animal-3", "title": "Part3", "rawData": require<RawData>("json!./animal/3.json")},
            //{"id": "animal-4", "title": "Part4", "rawData": require("json!./sara/4.json")},
            //{"id": "animal-5", "title": "Part5", "rawData": require("json!./sara/5.json")},
            //{"id": "animal-6", "title": "Part6", "rawData": require("json!./sara/6.json")},
            //{"id": "animal-7", "title": "Part7", "rawData": require("json!./sara/7.json")},
        ]
    },
];

export const postStorage = new (class {
    private _posts:Store<Post>;
    get posts() {
        if (!this._posts) {
            this._posts = new Store<Post>();
            posts.map(rawPost => {
                const post = new Post(rawPost, true);
                this._posts.push(post);
                this._posts.push(...post.parts);
            });
        }
        return this._posts;
    }

    getPostById(id:string):Post {
        return this.posts.getById(id);
    }
});

export const postLineStorage = new (class {
    private _lines:Store<PostLine>;
    get lines() {
        if (!this._lines) {
            this._lines = new Store([].concat(...postStorage.posts.map(post => post.lines)));
        }
        return this._lines;
    }

    getPostLineById(id:number) {
        return this.lines.getById(id);
    }
});
