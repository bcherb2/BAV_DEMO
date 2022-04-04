//ANT Server IP Address
const serverip = "192.168.1.58";
const username = 'admin';
const password = '123456';

//to-do, make length of optgroup dynamically update
const vehiclenames = {
    'v1': "1",
    'v2': "2",
    'v3': "3",
    'v4': "4",
    'v5': "5"
};

// Setting section to change the look and action
// of the three main buttons on the HMI
// name: displayed name
// lockToVehicle: if this mission is meant for a particular vehicle
//      NOTE: must either use 'specific vehicle' scheduler in ANT project
//      or setup a payload in the project named "Default Payload"
// stops: an array of the nodes you want the vehicle to move to,
//      the vehicle will not stop until the last node
// 
const insertion = 'Insertion5';

const firstButton = {
    'name': 'Launch Config',
    'lockToVehicle': true,
    'stops': ['201D','Insertion5','203D']
}

const secondButton = {
    'name': 'Pause',
    'lockToVehicle': true,
    'stops': ['201D','203D','Insertion5']
}

const thirdButton = {
    'name': 'Cancel All',
    'lockToVehicle': true,
    'stops': ['201D','203D','Insertion5']
}