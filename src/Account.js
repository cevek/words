import {vk} from './vk.js';
import {storage} from './storage.js';

if (!localStorage.userId) {
    localStorage.userId = Math.random().toString(33).substr(2, 20);
}

export class Account {
    userId = localStorage.userId;
    isAuthorized = false;

    onAuth(vkUserId) {
        this.vkUserId = vkUserId;
        return vk.fetchUserId(this.userId).then(userId=> {
            this.isAuthorized = true;
            localStorage.userId = this.userId = userId;
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
export const account = window.account = new Account();
