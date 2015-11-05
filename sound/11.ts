"use strict";

var canvasw = document.createElement('canvas');
document.body.appendChild(canvasw);
var ctxw = canvasw.getContext('2d');

var audio = document.createElement('audio');
audio.src = '11.mp3';
document.body.appendChild(audio);

var input1 = document.createElement('input');
document.body.appendChild(input1);

var input2 = document.createElement('input');
input2.value = (Math.random() * 20 | 0) + '';
input2.type = 'number';
document.body.appendChild(input2);

var fileInput = document.createElement('input');
fileInput.type = 'file';
document.body.appendChild(fileInput);
function handleFileSelect(evt:Event) {
    var files = fileInput.files; // FileList object
    var file = files[0];
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function () {
        parseAudio(reader.result).then(buff => {
            buffer = buff;
            var fft = getFFT(buffer);
            drawFFT(fft);
            calc(fft);
        });
    };
}

function drawFFT(fft:Uint8Array[]) {
    var width = Math.min(10000, fft.length);
    var height = fft[0].length;
    canvasw.setAttribute('width', width + '');
    canvasw.setAttribute('height', height + '');
    canvasw.style.cssText = `width: ${width / 2}px; height: ${height / 2}px`;
    var imd = ctxw.getImageData(0, 0, width, height);
    var imdd = imd.data;

    for (var i = 0; i < width; i++) {
        var item = fft[i];
        for (var j = 0; j < item.length; j++) {
            var val = item[j];
            var pos = ((height - j) * width + i) * 4;
            imdd[pos + 0] = val;
            imdd[pos + 1] = val;
            imdd[pos + 2] = val;
            imdd[pos + 3] = 255;
        }
    }
    ctxw.putImageData(imd, 0, 0);
}

function parseAudio(arraybuffer:ArrayBuffer) {
    return new Promise<AudioBuffer>((resolve, reject) => {
        context.decodeAudioData(arraybuffer, resolve, reject);
    });
}

fileInput.onchange = handleFileSelect;

var button = document.createElement('button');
button.textContent = 'play';
document.body.appendChild(button);

var button2 = document.createElement('button');
button2.textContent = 'stop';
document.body.appendChild(button2);
button2.onclick = ()=> {
    playSource.stop();
};

var fftSize = 1024;
var playSource:AudioBufferSourceNode;
button.onclick = ()=> {
    var freq = buffer.sampleRate / fftSize;
    var step = +input1.value / freq;
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
    var fft = getFFT(buffer);
    drawFFT(fft);
    calc(fft);
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

//var context = new AudioContext();

var globAnalizer:any;
var data = new Int8Array(128);
var ffds:any;

var DFT:any;
var FFT:any;
function getFFT(buffer:AudioBuffer) {
    var bufferSize = fftSize;
    var bufferSignalSize = bufferSize;

    var koef = 1;
    var items:Uint8Array[] = [];
    //var fft = new DFT(size, buffer.sampleRate);
    var fft = new FFT(bufferSize, 0);
    var signal:Float32Array = buffer.getChannelData(0);
    var bufferSignal = new Float32Array(bufferSignalSize);
    var k = 0;
    while (k < signal.length) {
        var i = 0;
        while (i < bufferSignalSize) {
            var smooth = 0;
            for (var j = k; j < k + koef; j++) {
                smooth += signal[j];
            }
            k += koef;
            bufferSignal[i] = smooth / koef;
            i++;
        }
        if (i < bufferSignalSize) {
            break;
        }
        fft.forward(bufferSignal);
        var spectrum = fft.spectrum;
        var arr = new Uint8ClampedArray(spectrum.length);
        for (var j = 0; j < spectrum.length; j++) {
            // equalize, attenuates low freqs and boosts highs
            //arr[j] = spectrum[j] * -1 * Math.log((bufferSize / 2 - j) * (0.5 / bufferSize / 2)) * bufferSize | 0;
            arr[j] = spectrum[j] * 5000;
        }
        items.push(arr);
    }
    //var spectrum = fft.spectrum;
    console.log(items);
    return items;
}

function getLine(fft:Uint8Array[]) {
    var line = new Uint32Array(fft.length);
    for (var i = 0; i < fft.length; i++) {
        var sum = 0;
        for (var j = 0; j < fft[i].length / 2; j++) {
            sum += fft[i][j];
        }
        line[i] = sum;
    }
    return line;
}

function calc(fft:Uint8Array[]) {
    var line = getLine(fft);
    console.time('count');
    var peaksData:number[] = [];
    var width = fft.length;

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

    var peaks:{diff:number; step: number}[] = [];
    for (var i = 0; i < peaksData.length; i++) {
        var obj = peaksData[i] || Infinity;
        peaks.push({diff: obj, step: i});
    }
    peaks.sort((a, b)=> a.diff < b.diff ? -1 : 1);
    console.log(peaks[0]);
    console.log(peaks);

    console.timeEnd('count');
    return count;
}

img.onload1 = function () {
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
