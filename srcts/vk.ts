import {config} from './config';
import {account} from './Account';
import {global} from './globals';

declare let VK:any;
var vkDefined = typeof VK == 'object';

if (vkDefined) {
    VK.init({
        apiId: 5068850
    });
}

export class VKManager {
    apiCall(method:string, params:any, timeout = 100) {
        return new Promise((resolve, reject)=> {
            if (vkDefined) {
                VK.Api.call(method, params, (r:any) => {
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
            }
            else {
                reject(new Error('vk is not defined'));
            }
        });
    }

    setKey(key:string, value:any) {
        return this.apiCall('storage.set', {key: key, value: JSON.stringify(value)});
    }

    getKeys(keys:string[]) {
        return this.apiCall('storage.get', {keys: keys}).then((items:{key: string; value: string}[]) => {
            const obj:{[index:string]: any} = {};
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                obj[item.key] = item.value ? JSON.parse(item.value) : '';
            }
            return obj;
        })
    }

    getKey(key:string) {
        return this.getKeys([key]).then(obj => obj[key]);
    }

    getAllData() {
        return this.apiCall('storage.getKeys', {count: 1000}).then((keys:string[]) => this.getKeys(keys));
    }

    login(hidden = false):Promise<number> {
        return new Promise((resolve, reject)=> {
            if (vkDefined) {
                let vkMethod = hidden ? VK.Auth.getLoginStatus : VK.Auth.login;
                vkMethod((response:any)=> {
                    if (response.session) {
                        resolve(response.session.mid);
                    }
                    else {
                        reject(response);
                    }
                });
            }
            else {
                reject(new Error('vk is not defined'));
            }
        });
    }

    fetchUserId(defaultUserId:string) {
        const userIdKey = 'userId';
        return this.getKey(userIdKey).then(userId => {
            if (!userId) {
                return this.setKey(userIdKey, defaultUserId).then(()=>defaultUserId);
            }
            return userId;
        });
    }
}

export const vk = new VKManager();
global.vk = vk;

