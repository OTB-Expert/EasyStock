export const UseSampleData = false;
export const UseLocalServer = false;
export const bus = new Vue();
export const BaseUrl = UseLocalServer ? 
	"https://localhost:5000/api/" : 
	"https://otb.expert/api/";
export const SampleSleep = 3000; // miliseconds

export const util = {
    human(timestamp){
        var a = new Date(timestamp);
        var year = a.getFullYear();
        var month = ('0' + (a.getMonth() + 1)).slice(-2);
        var date = ('0' + a.getDate()).slice(-2);
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + '-' + month + '-' + year + ' ' + hour + ':' + ('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2) ;
        return time;
    },
    humanMinut(timestamp){
        var a = new Date(timestamp);
        var year = a.getFullYear();
        var month = ('0' + (a.getMonth() + 1)).slice(-2);
        var date = ('0' + a.getDate()).slice(-2);
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + '-' + month + '-' + year + ' ' + hour + ':' + ('0' + min).slice(-2) ;
        return time;
    },
    random(max, min = 0) {
        return Math.floor(min + (max * Math.random()));
    },
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
}

export const api = {
    process: function(resolve, reject, that, meta, endpoint, r, showProgress = true) {
        r.errors = [];
        showProgress ? that.isLoading = false : null;        
        if(meta && meta.type){
            meta.isLoading = false;
        }
        if (r.status === 200) {
            bus.$emit('progress', {action: 'done', url: endpoint});
            r.json().then(d => {
                r.successfull = true;
                r.data = d;
                resolve(r);
            });
        } else
        if (r.status === 400) {
            bus.$emit('progress', {action: 'done', url: endpoint});
            r.json().then(d => {
                r.successfull = false;
                r.data = d.item;
                if(Array.isArray(d)) {
                    d.forEach(function(error) {
                        r.errors.push({
                            code: r.status,
                            message: error.errorMessage ? error.errorMessage : error,
                            item: error.item
                        });
                    });
                }
                else
                {
                    r.errors.push({
                        code: r.status,
                        message: d.errorMessage ? d.errorMessage : d,
                        item: d.item
                    });
                }
                resolve(r);
            });
        } else {
            bus.$emit('progress', {action: 'fail', url: endpoint});
            r.successfull = false;
            r.data = null;
            if (r.status === 404) {
                r.errors.push({
                    code: r.status,
                    message: 'Client is disconnected!'
                });
            }
            if (r.status === 500) {
                r.errors.push({
                    code: r.status,
                    message: '500: ' + JSON.stringify(r) 
                });
            }
            reject(r);
        }
    },
    get: function(that, endpoint, meta) {
        var showProgress = meta === true;
        return new Promise( function (resolve, reject) {
            bus.$emit('progress-start', endpoint);
            showProgress ? that.isLoading = true : null;
            if(meta){
                if(meta.type){
                    meta.isLoading = true;
                }
                if(meta.collection)
                {
                    that["isLoading_" + meta.collection] = true;
                }
            }
            if(that.response){
                that.response.timestamps.apiRequest = (new Date()).getTime();
            }
            if(UseSampleData){
                util.sleep(2000).then(() => {
                    if(that.response){
                        that.response.timestamps.apiRequest = (new Date()).getTime();
                    }
                    var from = util.random(100);
                    var len = util.random(50);
                    var slent = symbols.length;
                    var slice = symbols.slice(from, from + len);
                    console.log(from + slent + slice.length);
                    showProgress ? that.isLoading = false : null;
                    if(meta && meta.type){
                        meta.isLoading = false;
                    }
                    resolve(slice);
                });
            }
            else{
                fetch(BaseUrl + endpoint, {
                    "method": "GET",
                    "credentials": "same-origin",
                    "headers": {
                        "Content-Type": "application/json",
                    }
                })
                .then(r => api.process(resolve, reject, that, meta, endpoint, r))
                .catch(function(error) {
                    bus.$emit('error', { action: 'error', url: endpoint, error: error });
                });
            }
        })
    },
    post: function(that, endpoint, meta, request, showProgress = true) {
        return new Promise(function (resolve, reject) {
            showProgress ? that.isLoading = true : null;
            fetch(BaseUrl + endpoint,
                {
                    "method": "POST",
                    "body": JSON.stringify(request),
                    "credentials": "same-origin",
                    "headers": {
                        "Content-Type": "application/json",
                    }
                }).then(r => api.process(resolve, reject, that, meta, endpoint, r));
        })
    },
    loadJSON(type, callback) {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', './../../data/' + type + '.json', true);
        // Replace 'my_data' with the path to your file
        xobj.onreadystatechange = function() {
            if (xobj.readyState === 4 && xobj.status === 200) {
                // Required use of an anonymous callback 
                // as .open() will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }
}

export default {
    api,
    util,
    bus
}