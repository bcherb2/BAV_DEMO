// Create the object that will communicate with ANTserver
var server = new ANTserver("192.168.1.58", 8081, 9000);
//var status1 = 1;
//var status2 = null;

server.login("admin", "123456", function (isOk) {
  if (!isOk) {
    console.log("*** Error login into ANTserver ***");
  }
});
//***********************this function will call 2 missions, making a loop back to the starting point************************ */
//***********************For now, manually calling specific nodes for testing************************************************ */
function create2Mission(number, vehicle, to) {
  server.getVehicleStatus(vehicle, function (isOk, status) {
    if (status.missionid == "") {
      server.moveToNode(number, vehicle, to, function (isOk) {
        if (isOk) {
          console.log("*** Created Mission 1! ***");
          disableGUI();
          setTimeout(() => {
            server.getVehicleStatus(vehicle,function (isOk, status) {
                console.log(status);
                server.moveToNodeLinked(status.missionid,vehicle,"Insertion5",
                  function (isOk) {
                    if (!isOk) {
                      console.log("Problem creating mission to " + to);
                    } else {
                      console.log("*** Created Mission 2! ***");
                    }
                  }
                );
              },
              1000
            );
          });

          if (!isOk) {
            console.log("*** Error creating mission 1! ***");
            disableGUI();
            server.moveToNodeLinked(status.missionid,vehicle,"Insertion5",
                  function (isOk) {
                    if (!isOk) {
                      console.log("Problem creating mission to " + to);
                    } else {
                      console.log("*** Created Mission 2! ***");
                    }
                  }
                );
          }
        }
      });
    } else if (status.missionid != "") {
      console.log("Already on Mission " + status.missionid);
    }
  });
}

function vehiclestatus(){
  server.getVehicleStatus("Batman", function (isOk, status) {
    console.log(status.missionid);
    return status.missionid;
  });
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

//document.getElementById("box1").addEventListener("click", this.createMission());

/*     function submitPoll(){
     document.getElementById("box1").disabled = true;
     console.log('button-disabled');
     document.getElementById("overlay").style.display = "block";
       setTimeout(function() {
           document.getElementById("box1").disabled = false;
           console.log('BUTTON IS BACK!');
           document.getElementById("overlay").style.display = "none";
       }, 10000);
     
     } 
  */

/*         //if you want old browser support
     var vehicleIP = [].slice.call(document.querySelectorAll('select[name="vehicle"] > optgroup')).map(function(el) {
       return el.getAttribute('value')
     });
     alert(vehicleIP); */

//var x = this.createMission();