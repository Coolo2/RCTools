
var renders_downloaded = null

addRenders = async function(hidePartial) {
    if (!renders_downloaded) {
        r = await fetch("/api/backups")
        renders_downloaded = await r.json()
    }
    document.getElementById("selector").innerHTML = ""
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
        }

        html = html.split("%date%").join(backup.formatted_date)
        
        html = html.split("%dir%").join(backup.directory)
        html = html.split("%url%").join(url)
        html = html.split("%type%").join(backup.type)

        document.getElementById("selector").innerHTML += html
    }
}

addRenders()

async function openMap(url, date, type) {
    document.getElementById("backup-frame").src = url
    document.getElementById("backup-frame").style.display = "block"
    document.getElementById("close-frame").style.display = "block"

    text = document.getElementById("frame-info").innerText = `${type} render (${date})`
    text = text.split("%daysago%").join(backup.days_since)
    text = text.split("%dir%").join(backup.directory)
    document.getElementById("frame-info").innerText = text
    document.getElementById("frame-info").style.display = "block"
}

document.getElementById("close-frame").onclick = async function() {
    document.getElementById("backup-frame").removeAttribute("src")
    document.getElementById("backup-frame").style.display = "none"
    document.getElementById("close-frame").style.display = "none"
    document.getElementById("frame-info").style.display = "none"
}

document.getElementById("partial-toggle").oninput = async function(e) {
    if (e.currentTarget.checked) {
        await addRenders(true)
    } else {
        await addRenders()
    }
}

