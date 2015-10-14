import {HTTP} from './http';
import {vk} from './vk';
import {account} from './Account';
import {Post} from './Post';
import {posts} from './posts/posts';
import {Part} from "./posts/posts";

const assign:(target:any, ...sources:any[])=>any = (<any>Object).assign;

const prefix = 'post-';
const currentVersion = 1;

class UserInput {
    constructor(public id:number, public textId:number, public text:string) {
        shardStore.getShard(id).addUserText(this);
    }

    save() {
        return shardStore.getShard(this.id).save();
    }
}

var userInputStore = new class {
    userInputs:UserInput[] = [];
    autoIncrementId = 1;

    create(textId:number, text:string) {
        var userInput = new UserInput(this.autoIncrementId++, textId, text);
        this.userInputs.push(userInput);
        return userInput;
    }

    saveAll() {
        var queue:Promise<void>[] = [];
        for (var userInput of this.userInputs) {
            queue.push(userInput.save());
        }
        return Promise.all(queue);
    }
};

var shardStore = new class {
    shards:Shard[];

    getShard(userInputId:number):Shard {
        var id = userInputId / 30 | 0;
        var shard = this.shards.filter(shard => shard.id == id).pop();
        if (!shard) {
            shard = new Shard(id);
        }
        return shard;
    }

    findAll() {

    }
};

class Shard {
    serverRevision:number;
    revision:number;
    version:number;
    texts:UserInput[] = [];
    savingPromise: Promise<void>;

    constructor(public id:number) {}

    addUserText(userInput:UserInput) {
        this.texts.push(userInput);
        return this;
    }

    getKey() {
        return 'shard-' + this.id;
    }

    update() {
        localStorage[this.getKey()] = JSON.stringify(this);
    }

    toJson() {
        return {
            revision: this.revision,
            version: this.version,
            texts: this.texts.map(userInput => [userInput.id, userInput.textId, userInput.text])
        };
    }

    fromJson(serverData:any) {
        if (this.revision < serverData.revision) {
            this.revision = serverData.revision;
            this.version = serverData.version;
            this.texts = serverData.texts.map((json:[number, number, string]) => new UserInput(json[0], json[1], json[2]));
            this.update();
        }
    }

    save() {
        if (this.savingPromise){
            return this.savingPromise;
        }
        return this.savingPromise = Promise.resolve().then(()=> {
            var key = this.getKey();
            if (account.isAuthorized) {
                if (this.serverRevision < this.revision) {
                    let revision = this.revision;
                    this.fetch().then(() => {
                        if (revision === this.revision) {
                            return vk.setKey(key, this.toJson()).then(()=> {
                                this.serverRevision = revision;
                                this.update();
                            })
                        }
                    });
                }
            }
        }).then(()=> {
            this.savingPromise = null;
        });
    }

    fetch() {
        return vk.getKey(this.getKey()).then(serverData => this.fromJson(serverData));
    }
}

class Storage {
    data:{[key: string]: Post} = {};

    /*
        save(id)
            shard = getShard(id)
            shard.save()
            get(id)



     */

    set(postId:string, data:Post) {
        const key = prefix + postId;
        data.revision++;
        this.data[key] = data;
        this.saveToLocalStorage(key, data);
        this.saveToFirebase(key, data);
        this.saveAll();
    }

    get(postId:string) {
        const key = prefix + postId;
        let data = this.data[key];
        if (!data) {
            this.data[key] = data = new Post(postId);
        }
        return data;
    }

//[1111,1111,"Today, there is a new man at the market.asdf asfd asf af"],
    save(key:string, data:Post) {
        if (account.isAuthorized) {
            if (data.serverRevision < data.revision) {
                console.log("Save", key, data);
                let revision = data.revision;
                vk.getKey(key).then(serverData => {
                    data = this.merge(key, data, serverData);
                    if (revision === data.revision) {
                        console.log("Real saving", key, data);
                        return vk.setKey(key, assign({}, data, {serverRevision: void 0})).then(()=> {
                            data.serverRevision = revision;
                            this.saveToLocalStorage(key, data);
                        })
                    }
                });
            }
        }
        else {
            return Promise.resolve();
        }
    }

    saveAll() {
        //console.log("SaveAll");
        for (let key in this.data) {
            if (this.checkKey(key)) {
                this.save(key, this.data[key]);
            }
        }
    }

    saveToFirebase(key:string, value:any) {
        const http = new HTTP();
        http.put('https://wordss.firebaseio.com/web/data/users/' + account.userId + '/' + key + '.json', null, JSON.stringify(value));
    }

    saveToLocalStorage(key:string, data:Post) {
        localStorage[key] = JSON.stringify(data);
    }

    checkKey(key:string) {
        return key.substr(0, prefix.length) == prefix;
    }

    getPostIdFromKey(key:string) {
        return key.substr(prefix.length);
    }

    merge(key:string, localData:Post, serverData:Post) {
        if (!localData || localData.revision == null || localData.revision < serverData.revision) {
            this.data[key] = this.migrate(key, serverData);
            console.log("New data from vk", key, localData, serverData);
            serverData.revision = serverData.revision || 0;
            serverData.serverRevision = serverData.revision;
            this.saveToLocalStorage(key, serverData);
            return serverData;
        }
        this.data[key] = this.migrate(key, localData);
        return localData;
    }

    fetchAll():Promise<any> {
        //console.log("FetchAll");
        this.data = {};
        for (let key in localStorage) {
            if (this.checkKey(key)) {
                let data = JSON.parse(localStorage[key] || "{}");
                data.revision = data.revision || 0;
                data.serverRevision = data.serverRevision || 0;
                this.data[key] = this.migrate(key, data);
            }
        }
        if (account.isAuthorized) {
            return vk.getAllData().then(vkData => {
                for (let key in vkData) {
                    if (this.checkKey(key)) {
                        this.merge(key, this.data[key], vkData[key]);
                    }
                }
            })
        }
        return Promise.resolve(this.data);
    }

    migrate(key:string, data:any) {
        var postId = this.getPostIdFromKey(key);

        if (!data.version) {
            data = migrations[0].up(key, postId, data);
            this.save(key, data);
        }
        return data;
    }
}

var postsIds:{[index:string]:Part} = {};
for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    for (var j = 0; j < post.parts.length; j++) {
        var part = post.parts[j];
        postsIds[part.id] = part;
    }
}
var migrations:{version: number; up: (key:string, postId:string, data:any)=>any}[] = [
    {
        version: 1,
        up: (key:string, postId:string, data:any)=> {
            data.version = 1;
            data.revision++;
            data.postId = postId;
            for (var i = 0; i < data.lines.length; i++) {
                var line = data.lines[i];
                data.lines[i] = {
                    id: postsIds[postId].data[i].id,
                    items: line
                }
            }
            return data;
        }
    }
];
export const storage = new Storage();
(<any>window).stor = storage;

setInterval(() => {
    storage.saveAll();
}, 15000);

setInterval(() => {
    storage.fetchAll();
}, 20000);
