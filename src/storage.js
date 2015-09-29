import {HTTP} from './http.js';
import {vk} from './vk.js';
import {account} from './account.js';

const prefix = 'post-';
class Storage {
    data = {};
    commitData = {};

    set(postId, data) {
        const key = prefix + postId;
        this.data[key] = data;
        this.saveToLocalStorage(key, data);
        this.saveToFirebase(key, data);
        this.saveAll();
    }

    get(postId) {
        const key = prefix + postId;
        let data = this.data[key];
        if (!data) {
            this.data[key] = data = {currentLine: 0, lines: []};
        }
        return Promise.resolve(data);
    }

    save(key, data) {
        if (account.isAuthorized) {
            console.log("Save", key, data);
            return vk.setKey(key, data).then(()=> {
                this.commit(key, data.lines.length);
            })
        }
        else {
            return Promise.resolve();
        }
    }

    saveAll() {
        console.log("SaveAll");

        for (let key in this.data) {
            if (this.checkKey(key)) {
                const userPostData = this.data[key];
                if (!this.commitData[key] || (this.commitData[key] < userPostData.lines.length)) {
                    this.save(key, userPostData);
                }
            }
        }
    }

    commit(key, length) {
        this.commitData[key] = length;
        localStorage.commitData = JSON.stringify(this.commitData);
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

    fetchAll() {
        console.log("FetchAll");

        this.data = {};
        this.commitData = JSON.parse(localStorage.commitData || "{}");
        for (let key in localStorage) {
            if (this.checkKey(key)) {
                this.data[key] = JSON.parse(localStorage[key] || "{}");
            }
        }
        if (account.isAuthorized) {
            return vk.getAllData().then(vkData => {
                for (let key in vkData) {
                    if (this.checkKey(key)) {
                        const localData = this.data[key];
                        const newData = vkData[key];
                        if (!localData || !localData.lines || localData.lines.length < newData.lines.length) {
                            this.data[key] = newData;
                            console.log("New data from vk", localData, newData);
                            this.saveToLocalStorage(key, newData);
                            this.commit(key, newData.lines.length);
                        }
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