
var renders_downloaded = null
var current_index = null

addRenders = async function(hidePartial) {
    if (!renders_downloaded) {
        r = await fetch("/api/backups")
        renders_downloaded = await r.json()
    }
    document.getElementById("selector").innerHTML = ""
    counter = 0
    for (backup of renders_downloaded) {
        if (hidePartial && backup.type == "partial") continue 

        html = document.getElementById(`selector-example-${backup.type}`).innerHTML 

        if (backup.type == "full") {
            url = `/timemachine/${backup.directory}`
            if (backup.percent_complete < 100) {
                html = html.split("%style%").join(`style="background: linear-gradient(90deg, lime ${backup.percent_complete}%, #00000000 ${backup.percent_complete}%);"`)
            }
            html = html.split("%daysago%").join(backup.days_since)
        } else {
            url = `/timemachine/partial_backup/${backup.directory}/${backup.nearest_full}`
            html = html.split("%hoursago%").join(backup.hours_since)
            html = html.split("%fulldate%").join(backup.nearest_full_formatted_date)
        }

        html = html.split("%date%").join(backup.formatted_date)
        
        html = html.split("%dir%").join(backup.directory)
        html = html.split("%url%").join(url)
        html = html.split("%type%").join(backup.type)
        html = html.split("%index%").join(counter)

        document.getElementById("selector").innerHTML += html
        counter += 1
    }
    document.getElementById("selector").innerHTML += `<div style="height:200px;position:relative;float:left;width:100%;"></div>`
}

addRenders()

async function openMap(url, date, type, index) {
    current_index = parseInt(index)

    document.getElementById("backup-frame").src = url
    document.getElementById("backup-frame").style.display = "block"
    document.getElementById("close-frame").style.display = "block"
    document.getElementById("skip-frame").style.display = "block"

    text = document.getElementById("frame-info-text").innerText = `${type} render (${date})`
    text = text.split("%daysago%").join(backup.days_since)
    text = text.split("%dir%").join(backup.directory)
    document.getElementById("frame-info-text").innerText = text

    

    document.getElementById("frame-info").style.display = "block"

    if (type == "partial") {
        document.getElementById("frame-info-partial").innerText = `[Using full render from ${renders_downloaded[current_index].nearest_full_formatted_date} for images]`
        document.getElementById("frame-info-partial").style.display = "block"
    } else {document.getElementById("frame-info-partial").style.display = "none"}

    refreshButtons(renders_downloaded, current_index)
}

document.getElementById("close-frame").onclick = async function() {
    document.getElementById("backup-frame").removeAttribute("src")
    document.getElementById("backup-frame").style.display = "none"
    document.getElementById("close-frame").style.display = "none"
    document.getElementById("frame-info").style.display = "none"
    document.getElementById("skip-frame").style.display = "none"
}

document.getElementById("partial-toggle").oninput = async function(e) {
    if (e.currentTarget.checked) {
        await addRenders(true)
    } else {
        await addRenders()
    }
}

//refresh progress bars
setInterval(async function() {
    fetched_new = false 

    for (render of renders_downloaded) {
        if (render.percent_complete && render.percent_complete < 100) {
            
            fetched_new = true
            r = await fetch("/api/backups")
            renders_downloaded = await r.json()
            
        }
    }

    if (fetched_new) {
        await addRenders(document.getElementById("partial-toggle").checked)
        console.log("Updated Home Page")
    }
}, 10000)

function refreshButtons(backups, index) {
    amount_prev = backups.length - index -1
    amount_next = index
    document.getElementById("skip-back").setAttribute("aria-label", `Previous Render (${amount_prev})`)
    document.getElementById("skip-forward").setAttribute("aria-label", `Next Render (${amount_next})`)
    if (amount_prev == 0) {document.getElementById("skip-back").classList.add("disabled")} else {document.getElementById("skip-back").classList.remove("disabled")}
    if (amount_next == 0) {document.getElementById("skip-forward").classList.add("disabled")} else {document.getElementById("skip-forward").classList.remove("disabled")}
}

async function skip(amount) {
    
    filters_applied = []
    counter = 0
    for (backup of renders_downloaded) {
        if (!document.getElementById("partial-toggle").checked || backup.type != "partial") {
            filters_applied.push(backup)
        }
        counter += 1
    }

    loc = document.getElementById("backup-frame").contentWindow.location.href
    old_hash = loc.split("#")[1]
    
    new_index = current_index + amount
    
    if (amount > 0 && new_index >= filters_applied.length) {
        return $.notify("No older renders");
    }
    if (amount < 0 && new_index < 0) {
        return $.notify("No newer renders");
    }

    refreshButtons(filters_applied, new_index)

    backup = filters_applied[new_index]
    if (backup.type == "full") {
        url = `/timemachine/${backup.directory}`
    } else {
        url = `/timemachine/partial_backup/${backup.directory}/${backup.nearest_full}`
    }

    await openMap(url, backup.formatted_date, backup.type, new_index) 

    console.log(old_hash)
    setTimeout(async function() {
        new_href = document.getElementById("backup-frame").contentWindow.location.href
        document.getElementById("backup-frame").contentWindow.location.href = new_href.split("#")[0] + "#" + old_hash
    }, 250)
    
}

