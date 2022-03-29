//import { createRequire } from 'module';
//const require = createRequire(import.meta.url);
import axios from 'axios';
//const axios = require('axios').default;
axios.defaults.baseURL = '192.168.8.140:8081';
axios.defaults.headers.post['Content-Type'] = 'application/json';

export default class ANTServerRestClient {
    /*
     |  Generic REST Client to centralize handling of ANT Server API
     |  interactions.
    */

    constructor(host = '192.168.1.58', port = 8081) {
        this._host = host;
        this._port = port;

        this._hostURI = `http://${this._host}:${this._port}/`;
        this._requestor = 'admin';
        this.sessionToken = '';
        this._tokenPath = '?&sessiontoken=';

        // ANT Server Endpoints
        this._monitor = this._hostURI + 'wms/monitor/';
        this._restPath = this._hostURI + 'wms/rest/';
        this._login = this._monitor + 'session/login?username=admin&pwd=123456';
        this._devices = this._restPath + 'devices';
        this._vehicles = this._restPath + 'vehicles';
        this._map = this._restPath + 'maps';
        this._alarms = this._restPath + 'alarms';
        this._openAlarms = this._restPath + 'openalarms';
    }
    get token() {
        return this.sessionToken;
    }

    xstr(tag) {
        return tag ? tag.toString() : '';
    }

    checkTag(tagId, extra = null) {
        return tagId ? '/' + tagId + this.xstr(extra) : null;
    }

    setToken() {
        this.sessionToken = this.data.payload.sessiontoken;
    }

    async restrequest(url) {
        try {
            let res = await fetch(url);
            let data = res.data.payload;  
            return (data.sessiontoken) ? data.sessiontoken : data;
            
        } catch (err) {
            console.error('REST ERROR: ', err);
            this.GetToken();
            return err;
        }
    }
    buildURI = (path) => {
        let res1 = path + this._tokenPath + this.sessionToken;
        return res1;
    };

    buildRequest = async (path) => {
        let  res1 = await this.restrequest(this.buildURI(path, tag));
        return res1;
    };

    async GetToken() {
        try {
            this.sessionToken = await this.restrequest(this._login);
            return this.sessionToken;
        } catch (err) {
            console.error;
        }
    }

    async GetVehicles() {
        const res1 = await this.restrequest(this.buildURI(this._vehicles));
        //console.log(res1.location);
        return res1;
    }



    GetMaps(callback, levelid = 1) {
        /*
         |  Get map data for the current project. Level id defaults
         |  to 1 to match ANT Lab default.
        */

        var tag = '/level/' + levelid.toString() + '/data';
        this.buildRequest(this._map, callback, 'GET', (tag = tag));
    }

    GetDevices() {
        /*
         |  Get device data for all devices in the project.
         |  Specifying a device id returns data for that device.
        */

        //var tag = this.checkTag(device);
        this.buildRequest(this._devices, callback, 'GET', (tag = tag));
    }

    GetAlarms(callback) {
        this.buildRequest(this._alarms, callback);
    }
}
module.exports = ANTServerRestClient;
