import {account} from "./Account";
import {vk} from "./../services/vk";
import {Store} from "./../libs/Store";
import {UserInput, UserInputJSON} from "./UserInput";
export var shardPrefix = 'temp-shard-';

const currentVersion = 1;
type ShardServerData = {revision: number; serverRevision?:number; version: number; texts: UserInputJSON[]};
export class Shard {
    serverRevision = 0;
    revision = 0;
    version = currentVersion;
    texts:UserInput[] = [];
    savingPromise:Promise<void>;

    constructor(public id:number) {
    }

    addUserText(userInput:UserInput) {
        this.texts.push(userInput);
        return this;
    }

    getKey() {
        return shardPrefix + this.id;
    }

    update() {
        localStorage[this.getKey()] = JSON.stringify(this);
    }

    toJson() {
        return {
            revision: this.revision,
            version: this.version,
            texts: this.texts.map(userInput => userInput.toJson())
        };
    }

    fromJson(serverData:ShardServerData) {
        if (this.revision < serverData.revision) {
            this.revision = serverData.revision;
            this.serverRevision = serverData.serverRevision || this.revision;
            this.version = serverData.version;
            this.texts = serverData.texts.map(json => UserInput.fromJson(json));
            this.update();
        }
        return this;
    }

    save() {
        if (this.savingPromise) {
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

