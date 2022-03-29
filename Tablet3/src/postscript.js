function updateVehicleNames()  {
    document.getElementById("v1").innerHTML = vehiclenames.v1;
    document.getElementById("v2").innerHTML = vehiclenames.v2;
    document.getElementById("v3").innerHTML = vehiclenames.v3;
    document.getElementById("v4").innerHTML = vehiclenames.v4;
    document.getElementById("v5").innerHTML = vehiclenames.v5;
  
    document.getElementById("v1").value = vehiclenames.v1;
    document.getElementById("v2").value = vehiclenames.v2;
    document.getElementById("v3").value = vehiclenames.v3;
    document.getElementById("v4").value = vehiclenames.v4;
    document.getElementById("v5").value = vehiclenames.v5;

    document.getElementById("btn1-name").innerHTML = firstButton.name;
    document.getElementById("btn2-name").innerHTML = secondButton.name;
    document.getElementById("btn3-name").innerHTML = thirdButton.name;
    
  }; updateVehicleNames();