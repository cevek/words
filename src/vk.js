import {HTTP} from './http.js';

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
        const http = new HTTP();
        http.put('https://wordss.firebaseio.com/web/data/users/' + this.userId + '/.json', null, JSON.stringify({
            user: {
                vkId: this.vkUserId
            },
            data: value
        }));
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

    prepareAuth(data){
        this.userId = data.userId;
        this.vkUserId = data.vkUserId;
        return data;
    }

    login() {
        return new Promise(function (resolve, reject) {
            VK.Auth.login(VKManager.authInfo(resolve, reject));
        }).then(data=>this.prepareAuth(data))
    }

    getAuth() {
        return new Promise(function (resolve, reject) {
            VK.Auth.getLoginStatus(VKManager.authInfo(resolve, reject));
        }).then(data=>this.prepareAuth(data));
    }

    static authInfo(resolve, reject) {
        return function (response) {
            if (response.session) {
                const vkUserId = response.session.mid;
                const key = 'userId';
                VK.Api.call('storage.get', {key: key}, function (r) {
                    let userId;
                    if (r.response) {
                        userId = r.response;
                        resolve({userId, vkUserId});
                    }
                    else {
                        userId = Math.random().toString(33).substr(2, 20);
                        VK.Api.call('storage.set', {key: key, value: userId}, function (r) {
                            if (r.response == 1) {
                                resolve({userId, vkUserId});
                            }
                        });
                    }
                });
            } else {
                reject(response);
            }
        }
    }
}


export const vk = new VKManager();

window.vk = vk;

