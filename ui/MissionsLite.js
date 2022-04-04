class ANTServerRestClient {
  /*
   |  Generic REST Client to centralize handling of ANT Server API
   |  interactions.
  */

  constructor(host = "localhost", port = 8081) {
    this._host = host;
    this._port = port;

    this._hostURI = `http://${this._host}:${this._port}/`;
    this._requestor = "admin";
    this.sessionToken = "";
    this._tokenPath = "?&sessiontoken=";

    // ANT Server Endpoints
    this._monitor = this._hostURI + "wms/monitor/";
    this._restPath = this._hostURI + "wms/rest/";
    this._login = this._monitor + "session/login?username=admin&pwd=123456";
    this._devices = this._restPath + "devices";
    this._vehicle = this._restPath + "vehicles/";
    this._map = this._restPath + "maps";
    this._alarms = this._restPath + "alarms";
    this._openAlarms = this._restPath + "openalarms";
    this._missions = this._restPath + "missions";
  }
  get token() {
    return this.sessionToken;
  };

  xstr(tag) {
    return tag ? tag.toString() : "";
  };

  checkTag(tagId, extra = null) {
    return tagId ? "/" + tagId + this.xstr(extra) : null;
  };

  setToken() {
    this.sessionToken = this.data.payload.sessiontoken;
  };

  async restrequest(url, method, data) {
    try {
      let res = await fetch(url, {
          method: method,
          body: JSON.stringify(data),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        })
        .then((res) => res.json())
        .then((res) => res.payload);
      return res;
    } catch (err) {
      this.GetToken();
      console.error("REST ERROR: ", err);
      return err;
    }
  };
  buildURI = (path, tag = "") => {
    let res1 = path + tag + this._tokenPath + this.sessionToken;
    return res1;
  };

  buildRequest = async (path, method, tag, data) => {
    let res1 = await this.restrequest(
      this.buildURI(path, tag),
      method,
      data
    ).catch((error) => console.error(error));
    return res1;
  };

  async GetToken() {
    try {
      let res = await this.restrequest(this._login, "GET").catch((error) =>
        console.error(error)
      );
      this.sessionToken = res.sessiontoken;
      return this.sessionToken;
    } catch (err) {
      console.error(err);
    }
  };

  async GetVehicle(vehicleName) {
    var tag = vehicleName.toString() + "/info";
    let res = await this.buildRequest(this._vehicle, "GET", (tag = tag));
    //.then(res => res.vehicles[0]);
    //console.log('GETVEHICLE OUTPUT-------------');
    return res.vehicles[0];
  };

  GetAlarms(callback) {
    this.buildRequest(this._alarms, callback);
  };

  extractVehicle = async (vehicle) => {
    vehicle = document.getElementById("service-area").value;
    let data = {
      command: {
        name: "extract",
        args: {

        },
      },
    };
    let vc = vehicle + "/command";
    let res = await this.buildRequest(this._vehicle, "POST", vc, data);
    console.log(res);
    return res;
  };


  insertVehicle = async (vehicle, node) => {
    vehicle = document.getElementById("service-area").value;
    node = insertion;
    let data = {
      command: {
        name: "insert",
        args: {
          nodeId: node,
        },
      },
    };
    let vehiclecommand = vehicle + "/command";
    let res = await this.buildRequest(this._vehicle, "POST", vehiclecommand, data);
    console.log(res);
    return res;
  };

  moveToNode = async (vehicle, from, to, isLinkable='true') => {
    var missionData = {
      missionrequest: {
        requestor: vehicle,
        missiontype: "7",
        fromnode: from,
        tonode: to,
        cardinality: 1,
        parameters: {
          value: {
            vehicle: vehicle,
            isLinkable: isLinkable,
            payload: "Default payload",
          },
          desc: "Mission extension",
          type: "org.json.JSONObject",
          name: "parameters",
        },
      },
    };
    console.log(missionData);
    let url = this.buildURI(this._missions);
    let res = await this.restrequest(url, "POST", missionData).catch((err) => {
      console.log("REST REQUEST ERROR: " + err);
    });
    console.log(res);
    return res;
  };
  moveToLinkedNode = async (vehicle, from, to, linkedMission) => {
    var missionData = {
      missionrequest: {
        requestor: "admin",
        missiontype: "7",
        fromnode: from,
        tonode: to,
        cardinality: 1,
        parameters: {
          value: {
            vehicle: vehicle,
            linkedMission: linkedMission,
            isLinkable: true,
            payload: "Default payload",
          },
          desc: "Mission extension",
          type: "org.json.JSONObject",
          name: "parameters",
        },
      },
    };
    console.log(missionData);
    let url = this.buildURI(this._missions);
    let res = await this.restrequest(url, "POST", missionData)
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log("REST REQUEST ERROR: " + err);
      });
  };
}















var status1;
var client = new ANTServerRestClient(serverip, 8081);
var whatvehicle;

try {
  client.GetToken();
} catch (e) {
  setTimeout(function () {
    client.GetToken();
  }, 1000);
}


function GetSelectedVehicle() {
  var whatvehicle = document.getElementById("service-area").value;
  return whatvehicle;
}

//***********************this function will call 2 missions, making a loop back to the starting point************************ */
//***********************For now, manually calling specific nodes for testing************************************************ */
/* async function createMission(vehicle, to, from = "",isLinkable=true) {
  let res = await client.GetVehicle(vehicle);
  var missionid = await res.missionid;
  var operatingState = await res.operatingstate;
  if (missionid == "" && operatingState != "0") {
    var mission1 = await client.moveToNode(
      vehicle,
      from,
      to,
      (isLinkable = isLinkable)
    );
    if ((await client.GetVehicle(vehicle).missionid) != "") {
      console.log(`*** Created Mission 1! *** ${mission1}`);
      //disableGUI();
    }
  } else {
    if ((await missionid) != "")
      console.log("Currently on Mission: " + (await missionid));
    if ((await operatingState) == "0")
      console.log(
        "Vehicle is not ready to take a mission, operating state: " +
          (await operatingState)
      );
    //disableGUIfailed();
  }
} */



async function createMission(vehicle, to, from = "",isLinkable=true) {
  let res = await client.GetVehicle(vehicle);
  var missionid = await res.missionid;
  var operatingState = await res.operatingstate;
  if (missionid == "" && operatingState != "0") {
    let mission1 = await client.moveToNode(
      vehicle,
      from,
      to,
      (isLinkable = isLinkable)
    );
    if ((await client.GetVehicle(vehicle).missionid) != "") {
      console.log(`*** Created Mission 1! *** ${mission1}`);
      //disableGUI();
    
    }
    return mission1;
  } else {
    if ((await missionid) != "")
      console.log("Currently on Mission: " + (await missionid));
    if ((await operatingState) == "0")
      console.log(
        "Vehicle is not ready to take a mission, operating state: " +
          (await operatingState)
      );
    //disableGUIfailed();
  }
  
}


















function createLinkedMission(number, vehicle, to, from) {
  var i = 0;
  let res;
  var intr = setTimeout(async function () {
    res = await client.GetVehicle(vehicle);
    //console.log(res);
    if (res?.missionid) {
      clearInterval(intr);
      var missionid = (await parseInt(res.missionid)) + parseInt(number);
      //console.log(missionid);
      var mission2 = await client.moveToLinkedNode(
        vehicle,
        from,
        to,
        missionid
      );
      console.log(`*** Created Linked Mission! *** ${missionid}`);
      //console.log('VEHICLE STATUS: ');
      //console.log(res);
      return res;
    }
    if (++i == 100) clearInterval(intr);
  }, 1000);
  return res;
}

function disableGUI() {
  document.getElementById("box1").disabled = true;
  console.log("button-disabled");
  document.getElementById("overlay").style.display = "block";
  setTimeout(function () {
    document.getElementById("box1").disabled = false;
    console.log("BUTTON IS BACK!");
    document.getElementById("overlay").style.display = "none";
  }, 10000);
}

function disableGUIfailed() {
  document.getElementById("box1").disabled = true;
  console.log("button-disabled");
  document.getElementById("overlay2").style.display = "block";
  setTimeout(function () {
    document.getElementById("box1").disabled = false;
    console.log("BUTTON IS BACK!");
    document.getElementById("overlay2").style.display = "none";
  }, 2000);
}



generateMissions = async (missionSettings) => {
  var whatvehicle = await GetSelectedVehicle();
  console.log("Selected vehicle: " + whatvehicle);
  let res = await createMission(whatvehicle, missionSettings.stops[1], missionSettings.stops[0],missionSettings.lockToVehicle);
  //console.log(res);
  let res1 = await client.GetVehicle(whatvehicle);
  //console.log(res1);
/*   if ( res1.state['mission.info'][3] ){
    console.log('Linked Missions Already Exist!  Cannot create more!');
    return res1;
  }
  else{ */
  if (missionSettings.lockToVehicle && missionSettings.stops.length > 2){
    var i;
    var stops = missionSettings.stops.length;
    for( i=1; i+1<stops;i++ ){
      let res1 = await createLinkedMission(i-1, whatvehicle, missionSettings.stops[i+1], missionSettings.stops[i]);
    }
  } 
  return res;
  //}
}


document.getElementById("box1").addEventListener("click", async () => {
    let res = await generateMissions(firstButton);
    (res) ? disableGUI() : disableGUIfailed(); 
  });
document.getElementById("box2").addEventListener("click", () => {
  generateMissions(secondButton);
});
document.getElementById("box3").addEventListener("click", () => {
  generateMissions(thirdButton);
});







