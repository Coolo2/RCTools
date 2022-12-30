
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

login_code.oninput = async function() {
    r = await fetch(`/api/auth?code=${login_code.value}`)
    j = await r.json()

    if (j.id) {
        setCookie("code", login_code.value, 365)
        window.open(window.location + "?login", "_self")
    }
}
// dont remove
osmUrl = 'http://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.jpg'
var map = L.map('map', {}).setView([51.505, -0.09], 13);
L.tileLayer(osmUrl, {
    maxZoom: 6,
    noWrap: true
}).addTo(map);

if (location.search.includes("instant")) {
    map.setView([40, 0], 2);
    document.querySelector(".edit").style.display = "none"
    document.querySelector(".navbar").style.display = "none"
    map.zoomControl.remove()
} else {
    map.setView([40, 0], 4);
}



// Draw
var drawnItems = new L.FeatureGroup();
var user 
var drawControl


async function auth() {
    r = await fetch("/api/auth")
    user = await r.json()

    if (!viewNation) {
        viewNation = user.nation
        viewNationColor = user.config.color
    }

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
    
    if (location.search.includes("admin") && user.admin) {
        MicroModal.show('modal-admin'); // [1]
        window.history.pushState("","", "/map");
    }   
    if (user.id) {
        document.getElementById("edit-logout").style.display = "block"
    }
    if (user.id && viewNation) {
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
            position: 'bottomleft'
        });
        map.addControl(drawControl);
    }
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

if (location.search.includes("login")) {
    window.history.pushState("","", "/map");
    open_button()
}

edit_button.onclick = open_button
edit_admin_button.onclick = async function() {
    MicroModal.show('modal-admin'); // [1]
}

function customTip() {
    this.unbindTooltip();
    if(!this.isPopupOpen()) this.bindTooltip(`<b>${this.data.nation}</b> - added by <i>${this.data.name}</i>`).openTooltip();
}

var markerLayer

// Modal for marker labels
document.getElementById("submittext").onclick = async function(e) {
    markerLayer.bindTooltip(`<b>${document.getElementById("text").value}</b> - ${user.name}, ${viewNation}`, {permanent: true, className: "my-label", offset: [0, 0] });
    
    markerLayer.data = user

    r = await fetch("/api/claims", 
        {
            method:"PUT", 
            body:JSON.stringify({nation:viewNation, user:user.id, layer:markerLayer.toGeoJSON(), label:document.getElementById("text").value}),
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

    layer.data = user
    layer.data.nation = viewNation
    layer.data.config.color = viewNationColor
    layer.on('mouseover', customTip);

    r = await fetch("/api/claims", 
        {
            method:"PUT", 
            body:JSON.stringify({nation:viewNation, user:user.id, layer:layer.toGeoJSON()}),
            headers: {"Content-Type":"application/json"}
        }
    )
});

map.on(L.Draw.Event.DELETED, async function (e) {
    e.layers.eachLayer(layer => {
        map.removeLayer(layer);
    });
    
    r = await fetch("/api/claims", 
        {
            method:"DELETE", 
            body:JSON.stringify({layer:e.layers.toGeoJSON()}),
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
    select_nations.value = viewNation
    
    for (nation in d.editors) {
        for (editor in d.editors[nation]) {
            for (element of editors_select_class) {
                element.innerHTML += `<option value="${d.editors[nation][editor]}" style="color:${nations[nation].color}">${d.editors[nation][editor]} (${nation})</option>`
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
                    example = example.replace("(color)", nations[nation].color)
                    example = example.replace("{description}", `${d.editors[nation][editor]} is an editor for ${nation}`)
                }
                examples[counter] = example
                counter += 1;
            }
            
            document.getElementById("editors").innerHTML += examples[0]
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
                layer.data = {name:claim.user, nation:nation, original:layer, label:claim.label}
                layer.on("click", async function(e) {
                    if (e.target.data.label) {e.target._tooltip.toggle()}
                })
                if (claim.label && !location.search.includes("instant")) {layer.bindTooltip(`<b>${claim.label}</b> - ${claim.user}, ${nation}`, {permanent: true, className: "my-label", offset: [0, 0] });
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
        layer.data = {name:claim.user, nation:nation, original:layer, label:claim.label}
        layer.on("click", async function(e) {
            if (e.target.data.label) {e.target._tooltip.toggle()}
        })
        
        if (claim.label) {
            layer.bindTooltip(`<b>${claim.label}</b> - ${claim.user}, ${nation}`, {permanent: true, className: "my-label", offset: [0, 0] });
        } else {
            layer.on('mouseover', customTip);
        }

        async function edit(e) {
            edited_layers = []

            map.eachLayer(async function(layer){
                if (osmUrl != layer._url && layer.data){
                    if (layer.data.nation == e.target.data.nation) {
                        d = layer.toGeoJSON()
                        d.label = layer.data.label

                        edited_layers.push(d)
                    }
                };
            })
            await fetch("/api/claims", 
                {
                    method:"PATCH", 
                    body:JSON.stringify({nation:e.target.data.nation, layers:edited_layers}),
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
