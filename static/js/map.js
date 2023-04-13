
// MicroModal setup
MicroModal.init({
    openTrigger: 'data-custom-open', // [3]
    closeTrigger: 'data-custom-close', // [4]
    disableScroll: true, // [5]
    disableFocus: false, // [6]
    awaitCloseAnimation: false, // [7]
    debugMode: true // [8]
});

var adminCode
var viewNation
var viewNationColor
edit_admin_button = document.getElementById("edit-admin-button")
edit_button = document.getElementById("edit-button")
login_code = document.getElementById("login-code")
select_nations = document.getElementById("select-nations")
nations_select_class = document.querySelectorAll(".nations-select")
editors_select_class = document.querySelectorAll(".editors-select")
non_world_nations_select = document.querySelectorAll(".non-world-nation-select")
world_nations_select = document.querySelectorAll(".world-nation-select")

login_code.oninput = async function() {
    r = await fetch(`/api/auth?code=${login_code.value}`)
    j = await r.json()

    if (j.id) {
        setCookie("code", login_code.value, 365)
        window.open(window.location + "?login", "_self")
    }
}

osmUrl = 'https://raw.githubusercontent.com/Coolo22/RCTools/main/static/images/tiles/{z}_{x}_{y}.jpg'
var map = L.map('map', {})

L.tileLayer(osmUrl, {
    maxZoom: 7,
    noWrap: true,
    maxNativeZoom:5,
    minZoom: 3
}).addTo(map);

if (location.search.includes("instant")) {
    map.setView([10, 0], 4);
    document.querySelector(".edit").style.display = "none"
    document.querySelector(".navbar").style.display = "none"
    document.querySelector(".info").style.display = "none"
    map.zoomControl.remove()
} else {
    map.setView([10, 0], 4);
}

// Draw
var drawnItems = new L.FeatureGroup();
var user 
var drawControl


async function auth() {
    r = await fetch("/api/auth")
    user = await r.json()

    if (location.search.includes("admin") && user.admin) {
        MicroModal.show('modal-admin'); // [1]
        window.history.pushState("","", "/map");
    }   
    if (user.id) {
        document.getElementById("edit-logout").style.display = "block"
    }

    if (!viewNation && user.config) {
        viewNation = user.nation
        viewNationColor = user.config.color
    }

    if (user.id && viewNation) {
        
        urlParams = new URLSearchParams(window.location.search);
            for (item of urlParams) {
                if (item[0] == "adminCode") {
                    document.getElementById("adminCode").innerText = item[1]
                }
                if (user.editor) {
                    if (item[0] == "as") {
                        viewNation = item[1]
                    }
                    if (item[0] == "color") {
                        viewNationColor = "#" + item[1]
                    }
                }
        }

        document.getElementById("edit-user").style.display = "block"
        document.getElementById("edit-user-info").innerText = `${user.name} - ${viewNation}`
        

        if (drawControl) {
            map.removeControl(drawControl);
        }

        drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems
            },
            draw: {
                rectangle: false,
                marker: true,
                circlemarker:false,
                circle: false,
                polyline:false,
                polygon:{
                    shapeOptions: {
                        stroke: true,
                        color: viewNationColor
                    }
                }
            },
            position: 'bottomleft',
            
        });
        map.addControl(drawControl);
    }
    console.log(user)
    if (user.editor) {
        document.getElementById("select-nations-wrapper").style.display = "block"
    }
    if (user.admin) {
        edit_admin_button.style.display = "block"
    }

    return user
}
if (!location.search.includes("instant")) auth()


open_button = async function() {
    r = await fetch("/api/auth")
    user = await r.json()

    if (!user.id) {
        MicroModal.show('modal-login'); // [1]
    } else if (user.id && !user.nation) {
        MicroModal.show('modal-waiting'); // [1]
    } else {
        MicroModal.show('modal-edit'); // [1]
    }
}


if (location.search.includes("loginerror")) {
    MicroModal.show('modal-loginerror');
    window.history.pushState("","", "/map");
} else {
    if (location.search.includes("login")) {
        window.history.pushState("","", "/map");
        open_button()
    }
}

edit_button.onclick = open_button
edit_admin_button.onclick = async function() {
    MicroModal.show('modal-admin'); // [1]
}

function customTip() {
    this.unbindTooltip();
    if(!this.isPopupOpen()) this.bindTooltip(`<b>${this.properties.nation}</b> - added by <i>${this.properties.name}</i>`).openTooltip();
}
function customTipLabel() {
    this.unbindTooltip();
    if(!this.isPopupOpen()) this.bindTooltip(`<b>${this.properties.label}</b> - ${this.properties.name}, ${this.properties.nation}`).openTooltip();
    
}

var markerLayer

// Modal for marker labels
document.getElementById("submittext").onclick = async function(e) {
    markerLayer.bindTooltip(`<b>${document.getElementById("text").value}</b> - ${user.name}, ${viewNation}`, {permanent: true, className: "my-label", offset: [0, 0] });
    
    markerLayer.properties = user
    j = markerLayer.toGeoJSON()
    j.properties = markerLayer.properties 

    r = await fetch("/api/claims", 
        {
            method:"PUT", 
            body:JSON.stringify({nation:viewNation, user:user.id, layer:j, label:document.getElementById("text").value}),
            headers: {"Content-Type":"application/json"}
        }
    )
    MicroModal.close('modal-textinput')

    window.open(window.location, "_self")
}

map.on(L.Draw.Event.CREATED, async function (event) {
    // viewNation
    var layer = event.layer;
    
    if (layer.toGeoJSON().geometry.type == "Point") {
        markerLayer = layer
        MicroModal.show('modal-textinput', {
            onClose: async function(modal) {
                drawnItems.removeLayer(layer);
            }
        });
        return
    }   

    drawnItems.addLayer(layer);

    layer.properties = user
    layer.properties.nation = viewNation
    layer.properties.config.color = viewNationColor
    layer.on('mouseover', customTip);

    j = layer.toGeoJSON()
    j.properties = layer.properties

    r = await fetch("/api/claims", 
        {
            method:"PUT", 
            body:JSON.stringify({nation:viewNation, user:user.id, layer:j}),
            headers: {"Content-Type":"application/json"}
        }
    )
});

map.on(L.Draw.Event.DELETED, async function (e) {

    j = e.layers.toGeoJSON()
    j.features = []

    e.layers.eachLayer(layer => {
        gj = layer.toGeoJSON()
        delete layer.properties.original
        gj.properties = layer.properties

        j.features.push(gj)

        map.removeLayer(layer);
    });
    
    r = await fetch("/api/claims", 
        {
            method:"DELETE", 
            body:JSON.stringify({layer:j}),
            headers: {"Content-Type":"application/json"}
        }
    )
});




var nations;
var claims;

select_nations.oninput = async function(e) {
    r = await fetch("/api/claims")
    d = await r.json()

    if (select_nations.value == user.nation) {
        window.open(`/map`, "_self")
    } else {
        window.open(`/map?as=${select_nations.value}&color=${d.nations[select_nations.value].color.replace("#", "")}`, "_self")
    }
    
    
}

async function expandEditor(e) {
    
    m = document.getElementById(e.id + "-more") 
    h = "30px"
    
    if (m.style.height == h) {
        m.style.height = "0"
    } else {
        m.style.height = h
    }
}

async function load_claims() {
    
    r = await fetch("/api/claims")
    d = await r.json()

    r = await fetch("/api/auth")
    user = await r.json()

    nations = d.nations 
    claims = d.claims 

    for (element of nations_select_class) {
        for (nation in nations) {
            element.innerHTML += `<option value="${nation}" style="color:${nations[nation].color}">${nation}</option>`
        }
    }
    for (element of non_world_nations_select) {
        for (nation in nations) {
            if (!nations[nation].world) {
                element.innerHTML += `<option value="${nation}" style="color:${nations[nation].color}">${nation}</option>`
            }
        }
    }
    for (element of world_nations_select) {
        for (nation in nations) {
            if (nations[nation].world) {
                element.innerHTML += `<option value="${nation}" style="color:${nations[nation].color}">${nation}</option>`
            }
        }
    }
    select_nations.value = viewNation
    
    for (nation in d.editors) {
        for (editor in d.editors[nation]) {
            if (!nations[nation]) {
                color = "#000000"
            } else {
                color = nations[nation].color
            }

            for (element of editors_select_class) {
                element.innerHTML += `<option value="${d.editors[nation][editor]}" style="color:${color}">${d.editors[nation][editor]} (${nation})</option>`
            }

            examples = [document.getElementById("editor").innerHTML, document.getElementById("admin-editor").innerHTML]

            counter = 0
            for (example of examples) {
                
                example = example.split("{name}").join(d.editors[nation][editor])
                example = example.replace("{image}", `https://minotar.net/avatar/${d.editors[nation][editor]}`)
                example = example.replace("{nation}", nation)
                example = example.replace("{name_uri}", encodeURIComponent(d.editors[nation][editor]))
                example = example.replace("{onerror}", 'onerror="this.src=`https://i.pinimg.com/originals/54/f4/b5/54f4b55a59ff9ddf2a2655c7f35e4356.jpg`;this.onerror=null"')

                if (d.global_editors.includes(editor)) {
                    example = example.replace("(color)", "white")
                    example = example.replace("{description}", `${d.editors[nation][editor]} is a global editor. They originate from ${nation}`)
                } else {
                    example = example.replace("(color)", color)
                    example = example.replace("{description}", `${d.editors[nation][editor]} is an editor for ${nation}`)
                }
                examples[counter] = example
                counter += 1;
            }
            if (nation != "waiting") {
                document.getElementById("editors").innerHTML += examples[0]
            }
            
            document.getElementById("admin-editors").innerHTML += examples[1]
        }
        
    }

    for (nation in claims) {
        nation_claims = claims[nation]

        for (claim of nation_claims) {
            
            layer = L.geoJSON(claim.layer, { 
                style:{
                    "color": nations[nation].color,
                },
            })
            
            if (nation == viewNation) {
                addNonGroupLayers(layer, drawnItems, nation, claim);
            } else {
                layer.properties = {name:claim.layer.properties.name, nation:nation, original:layer, label:claim.label}
                layer.on("click", async function(e) {
                    if (e.target.properties.label) {
                        e.target.off("mouseover")
                        e.target.unbindTooltip();
                        e.target.bindTooltip(`<b>${e.target.properties.label}</b> - ${e.target.properties.name}, ${e.target.properties.nation}`, {permanent: true, className: "my-label", offset: [0, 0] });
                        
                        //
                    }
                })
                if (claim.label) {layer.on("mouseover", customTipLabel)
                } else {layer.on('mouseover', customTip);}

                layer.addTo(map)
            }
        }
    }
}
load_claims()

function addNonGroupLayers(sourceLayer, targetGroup, nation, claim) {
    
    if (sourceLayer instanceof L.LayerGroup) {
      sourceLayer.eachLayer(function(layer) {
        layer.properties = {name:claim.layer.properties.name, nation:nation, original:layer, label:claim.label}
        layer.on("click", async function(e) {
            if (e.target.properties.label) {
                console.log("h")
                e.target.off("mouseover")
                e.target.unbindTooltip();
                e.target.bindTooltip(`<b>${e.target.properties.label}</b> - ${e.target.properties.name}, ${e.target.properties.nation}`, {permanent: true, className: "my-label", offset: [0, 0] });
                e.target.properties.permanent = true
                //
            }
        })
        if (claim.label) {
            layer.on('mouseover', customTipLabel);
            //layer.bindTooltip(`<b>${claim.label}</b> - ${claim.layer.properties.name}, ${nation}`, {permanent: true, className: "my-label", offset: [0, 0] });
        } else {
            layer.on('mouseover', customTip);
        }

        async function edit(e) {
            edited_layers = []

            map.eachLayer(async function(layer){
                if (osmUrl != layer._url && layer.properties){
                    if (layer.properties.nation == e.target.properties.nation) {
                        d = layer.toGeoJSON()
                        d.label = layer.properties.label
                        delete layer.properties.original
                        d.properties = layer.properties

                        edited_layers.push(d)
                    }
                };
            })
            await fetch("/api/claims", 
                {
                    method:"PATCH", 
                    body:JSON.stringify({nation:e.target.properties.nation, layers:edited_layers}),
                    headers: {"Content-Type":"application/json"}
                }
            )
            
        }
        
        layer.on("edit", edit)
        layer.on("moveend", edit)
        addNonGroupLayers(layer, targetGroup);
      });
    } else {
      targetGroup.addLayer(sourceLayer);
    }
  }
map.addLayer(drawnItems);

map_info = document.getElementById("map-info")
map_info_text = document.getElementById("map-info-text")
map_info_chevron = document.getElementById("map-info-chevron")
map_info.onclick = async function() {
    if (map_info_text.style.height == "50vh") {
        map_info_text.style.height = "0"
        map_info_chevron.style.transform = "rotate(0deg)"
    } else {
        map_info_text.style.height = "50vh"
        map_info_chevron.style.transform = "rotate(180deg)"
    }
    
}
