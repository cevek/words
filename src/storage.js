import {HTTP} from './http.js';
import {vk} from './vk.js';
import {account} from './Account.js';

const prefix = 'post-';
class Storage {
    data = {};

    set(postId, data) {
        const key = prefix + postId;
        data.revision++;
        this.data[key] = data;
        this.saveToLocalStorage(key, data);
        this.saveToFirebase(key, data);
        this.saveAll();
    }

    get(postId) {
        const key = prefix + postId;
        let data = this.data[key];
        if (!data) {
            this.data[key] = data = {currentLine: 0, serverRevision: 0, revision: 0, lines: []};
        }
        return data;
    }

    save(key, data) {
        if (account.isAuthorized) {
            if (data.serverRevision < data.revision) {
                console.log("Save", key, data);
                let revision = data.revision;
                vk.getKey(key).then(serverData => {
                    data = this.merge(key, data, serverData);
                    if (revision === data.revision) {
                        console.log("Real saving", key, data);
                        return vk.setKey(key, {...data, serverRevision: void 0}).then(()=> {
                            data.serverRevision = revision;
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
        console.log("SaveAll");
        for (let key in this.data) {
            if (this.checkKey(key)) {
                this.save(key, this.data[key]);
            }
        }
    }

    saveToFirebase(key, value) {
        const http = new HTTP();
        http.put('https://wordss.firebaseio.com/web/data/users/' + account.userId + '/' + key + '.json', null, JSON.stringify(value));
    }

    saveToLocalStorage(key, data) {
        localStorage[key] = JSON.stringify(data);
    }

    checkKey(key) {
        return key.substr(0, prefix.length) == prefix;
    }

    merge(key, localData, serverData) {
        if (!localData || localData.revision == null || localData.revision < serverData.revision) {
            this.data[key] = serverData;
            console.log("New data from vk", key, localData, serverData);
            serverData.revision = serverData.revision || 0;
            serverData.serverRevision = serverData.revision;
            this.saveToLocalStorage(key, serverData);
            return serverData;
        }
        this.data[key] = localData;
        return localData;
    }


    fetchAll() {
        console.log("FetchAll");
        this.data = {};
        for (let key in localStorage) {
            if (this.checkKey(key)) {
                let data = JSON.parse(localStorage[key] || "{}");
                data.revision = data.revision || 0;
                data.serverRevision = data.serverRevision || 0;
                this.data[key] = data;
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
}

export const storage = window.storage = new Storage();
setInterval(() => {
    storage.saveAll();
}, 10000);

setInterval(() => {
    storage.fetchAll();
}, 15000);