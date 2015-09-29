import {config} from './config.js';
import {account} from './Account.js';

VK.init({
    apiId: 5068850
});

export class VKManager {
    apiCall(method, params, timeout = 100) {
        return new Promise((resolve, reject)=> {
            VK.Api.call(method, params, r => {
                console.log(r);
                if (r.error && r.error_code == 6) {
                    setTimeout(()=> {
                        resolve(this.apiCall(method, params, timeout * 1.5));
                    }, timeout);
                }
                else if (r.error) {
                    reject(r.error);
                }
                else if (r.response) {
                    resolve(r.response);
                }
                else {
                    reject(new Error(r));
                }
            });
        });
    }

    setKey(key, value) {
        return this.apiCall('storage.set', {key: key, value: JSON.stringify(value)});
    }

    getKeys(keys) {
        return this.apiCall('storage.get', {keys: keys}).then(items => {
            const obj = {};
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                obj[item.key] = item.value ? JSON.parse(item.value) : '';
            }
            return obj;
        })
    }

    getKey(key) {
        return this.getKeys(key).then(obj => obj[key]);
    }

    getAllData() {
        return this.apiCall('storage.getKeys', {count: 1000}).then(keys => this.getKeys(keys));
    }


    login(hidden) {
        let vkMethod = hidden ? VK.Auth.getLoginStatus : VK.Auth.login;
        return new Promise((resolve, reject)=> {
            vkMethod(response=> {
                if (response.session) {
                    resolve(response.session.mid);
                }
                else {
                    reject(response);
                }
            });
        });
    }

    fetchUserId(defaultUserId) {
        const userIdKey = 'userId';
        return this.getKey(userIdKey).then(userId => {
            if (!userId) {
                return this.setKey(userIdKey, defaultUserId).then(()=>defaultUserId);
            }
            return userId;
        });
    }
}

export const vk = window.vk = new VKManager();

