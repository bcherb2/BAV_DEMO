// Copyright (c) 2016 BlueBotics SA 

function ANTserver(ipAddr, monitorPort, navPort, logHandler) 
{
	// Declare and init data members
	this.ipAddr = ipAddr;
	this.monitorPort = monitorPort;
	this.navPort = navPort;
	this.logHandler = logHandler;
	this.sessionId = "";
	this.requestList = [];
	this.isSending = false;
	
	// Some "private" methods
	function init() 
	{
		try {
			this.xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
		} 
		catch (e) {
			try {
				this.xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			} 
			catch (e2) { 
				this.xmlhttp = new XMLHttpRequest();
			}
		}	
	}
	
	function log(message)
	{
		if (this.logHandler != null) {
			this.logHandler(message);
		}
	}
	
	function queueRequest(request)
	{
		if (!this.isSending) {
			sendRequest.call(this, request)
		}
		else {
			log.call(this, "Queuing request " + request.desc)
			this.requestList.unshift(request);
		}
	}
	
	function queueGetRequest(desc, port, path, params, callback)
	{
		var req = {
			method: "GET",
			host: "http://" + this.ipAddr + ":" + port,
			path: path,
			params: params,
			data: "",
			callback: callback,
			desc: desc
		};
		queueRequest.call(this, req);
	}
	
	function queuePostRequest(desc, port, path, data, callback)
	{
		var req = {
			method: "POST",
			host: "http://" + this.ipAddr + ":" + port,
			path: path,
			params: {},
			data: JSON.stringify(data),
			callback: callback,
			desc: desc
		};
		queueRequest.call(this, req);
	}
	
	function queueDeleteRequest(desc, port, path, data, callback)
	{
		var req = {
			method: "DELETE",
			host: "http://" + this.ipAddr + ":" + port,
			path: path,
			params: {},
			data: JSON.stringify(data),
			callback: callback,
			desc: desc
		};
		queueRequest.call(this, req);
	}

	function sendRequest(request)
	{
		this.isSending = true;

		// Build the parameter string
		var urlParams = "_=" + new Date().getTime();
		if (this.sessionId != "") urlParams += "&sessiontoken=" + this.sessionId;
		for (paramName in request.params) {
			urlParams += "&" + paramName + "=" + request.params[paramName];
		}

		// Send request
		var callback = request.callback
		var self = this;
		var method = request.method;
		var url = request.host + "/" + request.path + "?" + urlParams;
		var desc = request.desc;
		log.call(this, "Sending request " + desc);
		log.call(this, "Sending request " + request.data);
		this.xmlhttp.open(method, url, true);
	 	this.xmlhttp.onreadystatechange=function() 
	 	{
			//log.call(self, self.xmlhttp.readyState);
			if (self.xmlhttp.readyState==4) 
			{
				self.isSending = false;
				
				//log.call(self, "Got response for request " + desc);
				if (callback) 
				{
					var isOk = false;
					var msg = "Error sending command to WMS";
					var data = null;
					try 
					{
						var res = jQuery.parseJSON(self.xmlhttp.responseText);
						log.call(self, "RESPONSE : " +self.xmlhttp.responseText);
						if ('retcode' in res && 
						    res.retcode == 0 && 
						    'payload' in res) 
						{
							isOk = (res.retcode == 0); 
							msg = "";
							if ("errmessage" in res.payload) msg = res.payload.errmessage;
							data = res.payload;
						}
					}
					catch (e) 
					{
						isOk = false;
						msg = "Error parsing response"; 
					}
					callback.call(self, isOk, msg, data);
				}
				
				if (self.requestList.length > 0) 
				{
					var request = self.requestList.pop();
					sendRequest.call(self, request);
				}
			}
		}
		
		this.xmlhttp.send(request.data);
	}
	
	function getCurrentTime() {
		var now = new Date();
		//var date = now.format('yyyy-mm-dd') + "T" + now.format('HH:MM:ss+01:00');
		var date = now.format('yyyy-mm-dd') + "T" + now.format('HH:MM:ss');
		return date;
	}
	
	init.call(this);
	
	// Declare methods	
	this.login = function(name, password, callback) 
	{
		queueGetRequest.call(this, 
			"Login user " + name,
			this.monitorPort,
			"wms/monitor/session/login",
			{
				username: name,
				pwd: password
			}, 
			function(isOk, msg, data){
				if (isOk) this.sessionId = data.sessiontoken;
				if (callback) callback(isOk);
			}
		);
	};
	
	this.insertVehicle = function(vehicle, node, callback) 
	{
		queuePostRequest.call(this,
			"Insert " + vehicle + " on node " + node,
			this.monitorPort,
			"wms/rest/vehicles/" + vehicle + "/command",
			{
				command: {
					name: "insert",
					args: {
						nodeId: node
					}
				}
			}, 
			function(isOk, msg, data){
				if (callback) callback(isOk);
			}
		);
	};
	
	this.extractVehicle = function(vehicle, callback) 
	{
		queuePostRequest.call(this,
			"Extract " + vehicle,
			this.monitorPort,
			"wms/rest/vehicles/" + vehicle + "/command",
			{
				command: {
					name: "extract",
					args: {}
				}
			}, 
			function(isOk, msg, data){
				if (callback) callback(isOk);
			}
		);
	};
	
	this.transportToStation = function(number, payload, fromNode, targetStation, callback) 
	{
		queuePostRequest.call(this,
			"Transport " + number + " payload " + payload + " from " + fromNode + " to station " + targetStation,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: "script",
					missiontype: "0",
					fromnode: fromNode,
					tonode: targetStation,
					cardinality: number,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							payload: payload
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};	
	
	this.transportToNode = function(number, payload, fromNode, targetNode, callback) 
	{
		queuePostRequest.call(this,
			"Transport " + number + " payload " + payload + " from " + fromNode + " to node " + targetNode,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: "script",
					missiontype: "7",
					fromnode: fromNode,
					tonode: targetNode,
					cardinality: number,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							payload: payload
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};
	
	this.moveToStation = function(number, payload, targetStation, callback) 
	{
		queuePostRequest.call(this,
			"Move " + number + " payload " + payload + " to station " + targetStation,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: "script",
					missiontype: "1",
					fromnode: "",
					tonode: targetStation,
					cardinality: number,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							payload: payload
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};
	//***********************************Edited this function to include vehicle and make it linkable**************** */
	this.moveToNode = function(number, vehicle, targetNode, callback) 
	{
		queuePostRequest.call(this,
			"Move " + number + " vehicle " + vehicle + " to node " + targetNode,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: vehicle,
					missiontype: "10",
					fromnode: "",
					tonode: targetNode,
					cardinality: number,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							vehicle: vehicle,
							isLinkable: "True",
							linkWaitTimeout:3600
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};
//************************This is the linked mission*************************** */
	this.moveToNodeLinked = function(number, vehicle, targetNode, callback) 
	{
		queuePostRequest.call(this,
			"Move " + number + " vehicle " + vehicle + " to node " + targetNode,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: vehicle,
					missiontype: "10",
					fromnode: "",
					tonode: targetNode,
					cardinality: 1,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							vehicle: vehicle,
							linkedMission:number
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};
	
	this.moveVehicleToNode = function(vehicle, targetNode, callback) 
	{
		queuePostRequest.call(this,
			"Move " + vehicle + " to node " + targetNode,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: "script",
					missiontype: "10",
					fromnode: "",
					tonode: targetNode,
					cardinality: 1,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							vehicle: vehicle
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};
	
	this.waitingLane = function(number, targetStation, maxWaitingVehicles, maxDuration, callback) 
	{
		queuePostRequest.call(this,
			"Start waiting lane in station " + targetStation,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: "script",
					missiontype: "2",
					fromnode: "",
					tonode: targetStation,
					cardinality: number,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							maxwaitingvehicles: maxWaitingVehicles,
							maxduration: maxDuration
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk);
			}
		);
	};
	
	this.cancel = function(missionId, callback)
	{
		queueDeleteRequest.call(this,
			"Cancel mission " + missionId,
			this.monitorPort,
			"wms/rest/missions/" + missionId,
			{}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk);
			}
		);
	};
	
	this.getMissionStatus = function(missionId, callback)
	{
		desc = "Getting status of all missions"
		url = "wms/rest/missions"
		isGetAll = missionId === null || missionId == ""
		if (!isGetAll)
		{
			desc = "Getting status of mission " + missionId
			url = "wms/rest/missions/" + missionId
		}
		
		queueGetRequest.call(this, 
			desc,
			this.monitorPort,
			url,
			{},
			function(isOk, msg, data) {
				if (callback)
				{
					if (isOk)
					{
						try {
							if (isGetAll) {
								callback(true, data.missions)
							}
							else {
								callback(true, data.missions[0])
							}
						}
						catch (e) {
							callback(false, {})
						}
					}
					else {
						callback(false, {})
					}
				}
			}
		);
	};
	
	this.getDeviceStatus = function(deviceId, callback)
	{
		desc = "Getting status of all devices"
		url = "wms/rest/devices"
		isGetAll = deviceId === null || deviceId == "";
		if (!isGetAll)
		{
			desc = "Getting status of device " + deviceId
			url = "wms/rest/devices/" + deviceId
		}
		
		queueGetRequest.call(this, 
			desc,
			this.monitorPort,
			url,
			{},
			function(isOk, msg, data) {
				if (callback)
				{
					if (isOk)
					{
						try {
							if (isGetAll) {
								callback(true, data.devices)
							}
							else {
								callback(true, data.devices[0])
							}
						}
						catch (e) {
							callback(false, {})
						}
					}
					else {
						callback(false, {})
					}
				}
			}
		);
	};
	
	this.getVehicleStatus = function(vehicleName, callback)
	{
		desc = "Getting status of all vehicles"
		url = "wms/rest/vehicles"
		isGetAll = vehicleName === null || vehicleName == ""
		if (!isGetAll)
		{
			desc = "Getting status of vehicle " + vehicleName
			url = "wms/rest/vehicles/" + vehicleName + "/info"
		}
	
		queueGetRequest.call(this, 
			desc,
			this.monitorPort,
			url,
			{},
			function(isOk, msg, data) {
				if (callback)
				{
					if (isOk)
					{
						try {
							if (isGetAll) {
								callback(true, data.vehicles);
							}
							else {
								callback(true, data.vehicles[0]);
							}
						}
						catch (e) {
							callback(false, {})
						}
					}
					else {
						callback(false, {})
					}
				}
			}
		);
	};		
	
	this.writeIO = function(ioName, value, callback)
	{		
		queuePostRequest.call(this,
			"Write I/O " + ioName + " to " + value,
			this.monitorPort,
			"wms/rest/devices/" + ioName + "/command",
			{
				command: {
					name: "write",
					args: {
						value: value
					}
				}
			},
			function(isOk, msg, data) {
				if (callback) callback(isOk);
			}
		);
	}
	
	this.readIO = function(ioName, callback)
	{
		queueGetRequest.call(this,
			"Read I/O " + ioName,
			this.monitorPort,
			"wms/rest/devices/" + ioName,
			"",
			function(isOk, msg, data) {
				if (callback) {
					value = 0;
					try {
						if (isOk) {
							value = data.devices[0].meta.state.state.value;
						}
					}
					catch (err) {
						isOk = false;
					}
					callback(isOk, value);
				}
			}
		);
	}

	this.getAreas = function(callback)
	{
		queueGetRequest.call(this,
			"Get status of all areas",
			this.monitorPort,
			"wms/rest/areas",
			"",
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	}

	this.openArea = function(areaId, open, callback)
	{

		queuePostRequest.call(this,
			"Open area " + areaId,
			this.monitorPort,
			"wms/rest/areas/" + areaId + "/command",
			{
				command: {
					name: "open",
					args: {
						open: JSON.stringify(open)
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	}

	this.getLoops = function(callback)
	{
		queueGetRequest.call(this,
			"Get status of all loops",
			this.monitorPort,
			"wms/rest/loops",
			"",
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	}

	this.pauseLoop = function(loopName, open, callback)
	{

		queuePostRequest.call(this,
			"Pause loop " + loopName,
			this.monitorPort,
			"wms/rest/loops/" + loopName + "/command",
			{
				command: {
					name: "pause",
					args: {
						pause: JSON.stringify(open)
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	}
	this.missionCommand = function(missionId, command, args, callback)
	{

		queuePostRequest.call(this,
			"Send command " + command + " to mission " + missionId,
			this.navPort,
			"wms/rest/missions/" + missionId + "/command/" + command,
			{
				txid: 12,
				protocol: "1.0",
				payload: {
					code: 15,
					timestamp: getCurrentTime(),
					missionid: missionId,
					command: command,
					args: args
				}
			},
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	}


	this.linkedTransportFromNodeToNode = function(number, payload, fromNode, toNode, isLinkable, linkageTimeout, linkedMission, callback) 
	{
		queuePostRequest.call(this,
			"Transport " + number + " payload " + payload + " from " + fromNode + " to " + toNode,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: "script",
					missiontype: "7",
					fromnode: fromNode,
					tonode: toNode,
					cardinality: number,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							payload: payload,
							isLinkable:isLinkable,
							linkWaitTimeout:linkageTimeout,
							linkedMission:linkedMission
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};	

	this.transportFromNodeToNode = function(number, payload, fromNode, toNode, callback) 
	{
		queuePostRequest.call(this,
			"Transport " + number + " payload " + payload + " from " + fromNode + " to " + toNode,
			this.monitorPort,
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: "script",
					missiontype: "7",
					fromnode: fromNode,
					tonode: toNode,
					cardinality: number,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							payload: payload
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};	

	// vehicle command insert into loop
	this.insertVehicleIntoLoop = function(vehicle, node, callback) 
	{
		queuePostRequest.call(this,
			"Insert " + vehicle + " into loop at node " + node,
			this.monitorPort,
			"wms/rest/vehicles/" + vehicle + "/command",
			{
				command: {
					name: "insertintoloop",
					args: {
						nodeId: node
					}
				}
			}, 
			function(isOk, msg, data){
				if (callback) callback(isOk);
			}
		);
	};

	// mission of type loop -> does not work !!! 
	this.loop = function(number, payload, loopName, callback) 
	{
		queuePostRequest.call(this,
			"coucou",
			"wms/rest/missions",
			{
				missionrequest: {
					requestor: "script",
					missiontype: "12",
					priority : "0",
					cardinality: number,
					tonode: loopName,
					deadline: getCurrentTime(),
					dispatchtime: getCurrentTime(),
					parameters: {
						value: {
							payload: "Payload 1",
							priority: "Medium"
						},
						desc: "Mission extension",
						type: "org.json.JSONObject",
						name: "parameters"
					}
				}
			}, 
			function(isOk, msg, data) {
				if (callback) callback(isOk, data);
			}
		);
	};	
}
/*
Exemple:
var server = new ANTserver(127.0.0.1, 8081, 9000);
server.login("admin", "123456");
server.insertVehicle("Evo01", "Charger-001");
server.moveToNode("1", "PL-Food", "US_Washing_1");
server.transportToNode("1", "PL-Food", "Reader-ReturnLaundry", "US_Washing_9");
server.waitingLane("3", "ST-Kitchen", "2", "10");
*/

