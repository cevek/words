export class HTTP {
    constructor(prefix, throttle) {
        this.prefix = prefix || '';
        this.throttle = throttle;
        this.cache = {};
    }

    request(method, url, params, data, useCache) {
        let pUrl = this.prefix + url;
        if (params) {
            pUrl += '?' + this.paramsToUrl(params);
        }
        return new Promise((resolve, reject) => {
            if (useCache && this.cache[pUrl]) {
                resolve(this.cache[pUrl]);
            }
            else {
                const req = new XMLHttpRequest();
                req.open(method, pUrl, true);
                req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                //req.withCredentials = true;
                req.onreadystatechange = () => {
                    if (req.readyState == 4) {
                        let responseData = req.responseText;
                        try {
                            responseData = JSON.parse(req.responseText);
                        }
                        catch (e) {
                            console.error('HTTP answer is not JSON:', responseData);
                        }

                        const done = ()=> {
                            if (req.status == 200) {
                                resolve(responseData);
                                this.cache[pUrl] = responseData;
                            }
                            else {
                                reject({data: responseData, status: req.status});
                            }
                            //console.log("http done", url);
                        };

                        if (this.throttle) {
                            setTimeout(done, this.throttle);
                        }
                        else {
                            done();
                        }
                    }
                };
                req.send(JSON.stringify(data));
            }
        });
    }

    get(url, params, useCache) {
        return this.request('GET', url, params, null, useCache);
    }

    post(url, params, data) {
        return this.request('POST', url, params, data);
    }
    put(url, params, data) {
        return this.request('PUT', url, params, data);
    }

    paramsToUrl(obj) {
        return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
    }

    clearCache() {
        this.cache = {};
    }
}
