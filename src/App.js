'use strict';

//todo: the same keys => ..s, his-him-her, at-to-into, 1 sym mistake,
//todo: last the a is must be separatly

class App {
    constructor() {
        this.postId = 'alisa2';
        this.oldPostId = 'alisa';
        this.postData = alisaData;
        this.currentLine = 0;
        this.render();
        this.updateTranslateSentence();
        this.fill();
    }

    getUserData(postId) {
        try {
            var item = localStorage[postId];
            if (item) {
                var dt = JSON.parse(item);
            }
            else {
                dt = {lines: []};
            }
        }
        catch (e) {
            console.error(e);
            dt = {lines: []};
        }
        return dt;
    }

    saveLine() {
        var data = this.getUserData(this.postId);
        data.lines.push(this.text.value);
        localStorage[this.postId] = JSON.stringify(data);
        this.text.value = '';
        window.scrollTo(0, 100000);
    }

    getCurrentOrigin(){
        return this.postData.data[this.currentLine][0];
    }

    getCurrentTranslate(){
        return this.postData.data[this.currentLine][1];
    }

    updateTranslateSentence(){
        this.translate.textContent = this.getCurrentTranslate();
    }

    fill() {
        var data = this.getUserData(this.postId);
        var oldData = this.getUserData(this.oldPostId);
        for (var i = 0; i < data.lines.length; i++) {
            var line = data.lines[i];
            var oldLine = oldData.lines[i];
            this.createSentence(oldLine, line);
            this.setNextSentence();
        }
        this.updateTranslateSentence();
    }

    createSentence(oldLine, line){
        new Sentence(this, this.getCurrentOrigin(), oldLine);
        new Sentence(this, this.getCurrentOrigin(), line);
        var div = document.createElement('div');
        div.classList.add('hr');
        this.items.appendChild(div);

    }

    setNextSentence() {
        this.currentLine++;
    }


    onSubmit() {
        var oldData = this.getUserData(this.oldPostId);
        this.createSentence(oldData.lines[this.currentLine], this.text.value);
        this.saveLine();
        this.setNextSentence();
        this.updateTranslateSentence();
        return false;
    }

    render() {
        this.app = document.createElement('div');
        this.app.classList.add('app');
        document.body.appendChild(this.app);

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.app.appendChild(this.svg);

        this.items = document.createElement('div');
        this.items.classList.add('items');
        this.app.appendChild(this.items);

        this.form = document.createElement('form');
        this.form.classList.add('form');
        this.form.onsubmit = ()=>this.onSubmit();
        this.app.appendChild(this.form);

        this.translate = document.createElement('div');
        this.translate.classList.add('translate');
        this.form.appendChild(this.translate);

        this.text = document.createElement('input');
        this.text.classList.add('text');
        this.text.setAttribute('type', 'text');
        this.text.setAttribute('required', true);
        this.form.appendChild(this.text);
    }
}

new App();

