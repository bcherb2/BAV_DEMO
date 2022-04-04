from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()


#@app.get("/", response_class=HTMLResponse)
#async def index():
#    #return index.html
#    return '<h1>Hello World</h1>'

@app.get("/vehicles/")
async def vehicles():
    return


@app.get("/vehicles/{vehicle_name}")
async def vehicle(vehicle_name: str):
    return

@app.get("/getmissions/")
async def getmissions():
    return


@app.post("/examples/opcua/")
async def opcua():
    return

@app.post("/examples/arrival/")
async def arrival():
    return

@app.post("/examples/master/")
async def arrival():
    return

@app.get("/mission/{to_node}")
async def create_mission_to():
    return


@app.get("/mission/{from_node}/{to_node}")
async def create_mission_from_to():
    return

@app.get("/endurance/{cycles}")
async def endurance():
    return



#app.mount("/api", api_app)
app.mount("/", StaticFiles(directory="ui", html=True), name="ui") 