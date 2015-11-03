import {HTTP} from './../libs/HTTP';
import {vk} from './vk';
import {account} from './../models/Account';
import {UserPost} from './../models/UserPost';
import {PostLine} from "./../models/PostLine";
import {Store} from "./../libs/Store";

const assign:(target:any, ...sources:any[])=>any = (<any>Object).assign;

const prefix = 'post-';

class Storage {
    data:{[key: string]: UserPost} = {};

    /*
     save(id)
     shard = getShard(id)
     shard.save()
     get(id)



     */

    set(postId:string, data:UserPost) {
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
            this.data[key] = data = new UserPost(postId);
        }
        return data;
    }

//[1111,1111,"Today, there is a new man at the market.asdf asfd asf af"],
    save(key:string, data:UserPost) {
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

    saveToLocalStorage(key:string, data:UserPost) {
        localStorage[key] = JSON.stringify(data);
    }

    checkKey(key:string) {
        return key.substr(0, prefix.length) == prefix;
    }

    getPostIdFromKey(key:string) {
        return key.substr(prefix.length);
    }

    merge(key:string, localData:UserPost, serverData:UserPost) {
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
        return data;
    }
}

var migrations:{version: number; up: (key:string, postId:string, data:any)=>any}[] = [
    /*{
        version: 1,
        up: (key:string, postId:string, data:any)=> {

        }
    }*/
];
export const storage = new Storage();
(<any>window).stor = storage;

setInterval(() => {
    storage.saveAll();
}, 5000);

setInterval(() => {
    //storage.fetchAll();
}, 5000);
