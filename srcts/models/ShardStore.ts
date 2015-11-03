import {account} from "./Account";
import {vk} from "./../services/vk";
import {Store} from "../libs/Store";
import {Shard, shardPrefix} from "./Shard";

class ShardStore extends Store<Shard> {
    getShard(userInputId:number):Shard {
        var id = userInputId / 20 | 0;
        var shard = this.getById(id);
        if (!shard) {
            shard = new Shard(id);
            this.addShard(shard);
        }
        return shard;
    }

    addShard(shard:Shard) {
        if (!this.getById(shard.id)) {
            this.push(shard);
        }
    }

    private checkKey(key:string) {
        return key.substr(0, shardPrefix.length) == shardPrefix;
    }

    private getIdFromKey(key:string):number {
        return +key.substr(shardPrefix.length);
    }

    saveAll() {
        console.log("shardStore saveAll");
        return Promise.all(this.getItems().map(shard => shard.save()));
    }

    fetchAll() {
        console.log("shardStore fetchAll");
        //console.log("FetchAll");
        //this.data = {};
        for (let key in localStorage) {
            if (this.checkKey(key)) {
                let data = JSON.parse(localStorage[key] || "{}");
                var shard = new Shard(this.getIdFromKey(key));
                shard.fromJson(data);
                this.addShard(shard);
            }
        }
        if (account.isAuthorized) {
            return vk.getAllData().then(vkData => {
                for (let key in vkData) {
                    if (this.checkKey(key)) {
                        var shard = new Shard(this.getIdFromKey(key));
                        shard.fromJson(vkData[key]);
                        this.addShard(shard);
                    }
                }
            })
        }
        return Promise.resolve();
    }
}
export var shardStore = new ShardStore();


setInterval(() => {
    shardStore.saveAll();
}, 5000);

setInterval(() => {
    shardStore.fetchAll();
}, 5000);
