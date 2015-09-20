'use strict';

//todo: the same keys => ..s, his-him-her, at-to-into, 1 sym mistake,
//todo: last the a is must be separatly

class App {
    constructor() {
        this.postId = 'alissa';
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
        }
        catch (e) {
            console.error(e);
        }
        if (!dt){
            dt = {currentLine: 0, lines: []};
        }
        return dt;
    }

    saveLine() {
        var data = this.getUserData(this.postId);
        var line = data.lines[this.currentLine] || (data.lines[this.currentLine] = []);
        data.currentLine += 1;
        line.push(this.text.value);
        localStorage[this.postId] = JSON.stringify(data);
        this.text.value = '';
        window.scrollTo(0, 100000);
        return data;
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
        for (var i = 0; i < data.currentLine; i++) {
            var line = data.lines[i];
            new SentenceBlock(this.items, this.svg, this.getCurrentOrigin(), line);
            this.setNextSentence();
        }
        this.updateTranslateSentence();
    }

    setNextSentence() {
        this.currentLine++;
    }


    onSubmit() {
        var data = this.saveLine();
        new SentenceBlock(this.items, this.svg, this.getCurrentOrigin(), data.lines[this.currentLine]);
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

