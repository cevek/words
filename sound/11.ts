"use strict";

var audio = document.createElement('audio');
audio.src = '11.mp3';
document.body.appendChild(audio);

var input1 = document.createElement('input');
document.body.appendChild(input1);

var input2 = document.createElement('input');
input2.value = (Math.random() * 20 | 0) + '';
input2.type = 'number';
document.body.appendChild(input2);

var button = document.createElement('button');
button.textContent = 'play';
document.body.appendChild(button);

var button2 = document.createElement('button');
button2.textContent = 'stop';
document.body.appendChild(button2);
button2.onclick = ()=> {
    playSource.stop();
};

var playSource:AudioBufferSourceNode;
button.onclick = ()=> {
    var step = +input1.value / 50;
    var offset = +input2.value;
    var start = offset * step;
    var end = (offset + 1) * step;
    playSource = play(buffer, start, end);
};

var context = new AudioContext();

function loadSound(url:string) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.send();

    // Decode asynchronously
    return new Promise<AudioBuffer>((resolve, reject) => {
        request.onload = () => {
            context.decodeAudioData(request.response, buffer => {
                resolve(buffer);
            }, ()=>console.log('Error when decoding'));
        }
    });
}
var buffer:AudioBuffer;
loadSound('11.mp3').then(bf => {
    buffer = bf;
});

function play(buffer:AudioBuffer, start:number, end:number) {
    if (playSource) {
        playSource.stop();
    }
    start = start * buffer.sampleRate | 0;
    end = end * buffer.sampleRate | 0;
    var len = end - start;
    var channel:Float32Array = buffer.getChannelData(0);

    var source = context.createBufferSource();
    var _source = context.createBuffer(1, len, buffer.sampleRate);
    source.buffer = _source;
    var sourceChannel:Float32Array = _source.getChannelData(0);
    var cut = channel.subarray(start, end);
    sourceChannel.set(cut);

    source.connect(context.destination);
    source.start(0);
    source.loop = true;
    return source;
}

var canvas = document.createElement('canvas');
//document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');

var img = new Image();
img.src = 'spectrogram.png';
var width = 0;
var height = 0;

class Peaks {
    constructor(public count:number, public step:number, public shift:number) {

    }
}

img.onload = function () {
    width = img.width;
    height = img.height;
    canvas.setAttribute('width', width + '');
    canvas.setAttribute('height', height + '');
    ctx.drawImage(img, 0, 0);
    var imd = ctx.getImageData(0, 0, width, height);
    var imdd = imd.data;
    var line = new Uint32Array(width);

    function getLine() {
        for (var i = 0; i < width; i++) {
            var sum = 0;
            for (var j = 0; j < height; j++) {
                var val = imdd[(i + j * width) * 3];
                sum += val;
            }
            line[i] = sum;
        }
        return line;
    }

    var line = getLine();

    var peaksData:number[] = [];

    /*
        for (var step = 20; step < 500; step++) {
            peaksData[step] = [];
            for (var shift = 0; shift < step; shift++) {
                var sum = 0;
                var count = 0;
                for (var i = shift; i < width; i += step) {
                    sum += line[i];
                    count++;
                }
                peaksData[step][shift] = sum / count | 0;
            }
        }
    */

    function calc() {
        console.time('count');
        for (var step = 100; step < 600; step++) {
            var sum = 0;
            var count = 0;
            for (var i = 0; i < width - step; i += step) {
                for (var p = i + step; p < width - step; p += step) {
                    for (var j = 0; j < step; j++) {
                        var diff = line[i + j] - line[p + j];
                        sum += diff > 0 ? diff : -diff;
                        count++;
                    }
                }
            }
            peaksData[step] = sum / count | 0;
        }
        console.timeEnd('count');
        return count;
    }

    var count = calc();
    console.log(count);

    var peaks:{diff:number; step: number}[] = [];
    for (var i = 0; i < peaksData.length; i++) {
        var obj = peaksData[i] || Infinity;
        peaks.push({diff: obj, step: i});
    }
    peaks.sort((a, b)=> a.diff < b.diff ? -1 : 1);

    //var peaks:{step:number; count: number}[] = [];

    /*for (var step = 20; step < peaksData.length; step++) {
        for (var shift = 0; shift < peaksData[step].length; shift++) {
            var pd = peaksData[step][shift];
            if (!peaks[step] || peaks[step].count < pd) {
                peaks[step] = {count: pd, step: step};
            }
            //peaks.push(new Peaks(peaksData[step][shift], step, shift))
        }
    }

    peaks.sort((a, b)=>a.count > b.count ? -1 : 1);*/

    console.log(peaks);
    //input1.value = peaks[0] + '';
    console.log(peaksData);
};

var a = new Uint8Array(15000);
function abc() {
    console.time('abc');
    for (var i = 0; i < 15000; i++) {
        for (var j = i; j < i + 500; j++) {
            for (var k = 0; k < 64; k++) {
                a[i] === a[i];
            }
        }
    }
    console.timeEnd('abc');
}
//abc();