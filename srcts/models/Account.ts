import {vk} from './../services/vk';
import {storage} from './../services/storage';

if (!localStorage['userId']) {
    localStorage['userId'] = Math.random().toString(33).substr(2, 20);
}

const userKey = 'userId';

export class Account {
    userId = localStorage[userKey];
    isAuthorized = false;
    vkUserId: number;

    onAuth(vkUserId: number) {
        this.vkUserId = vkUserId;
        return vk.fetchUserId(this.userId).then(userId=> {
            this.isAuthorized = true;
            localStorage[userKey] = this.userId = userId;
        });
    }

    fetch() {
        return vk.login(true)
            .then(vkUserId=> this.onAuth(vkUserId), ()=>null)
            .then(()=> storage.fetchAll());
    }

    login() {
        return vk.login()
            .then(vkUserId=> this.onAuth(vkUserId), ()=>null)
            .then(()=> storage.fetchAll());
    }
}
export const account = new Account();
(<any>window).acc = account;
