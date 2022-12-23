const URLParams = new URLSearchParams(window.location.search)

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {return i + "st";};if (j == 2 && k != 12) {return i + "nd";};if (j == 3 && k != 13) {return i + "rd";};return i + "th";
}
months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const day_length_milliseconds = 24 * 60 * 60 * 1000;
const epoch = new Date(2022, 0, 1);

input = document.getElementById("specific-date")
time = document.getElementById("time")
time_small = document.getElementById("time-small")
copy = document.getElementById("copy")
show_seconds = document.getElementById("show_seconds")
rl_date = document.getElementById("rl-date")

time_small_rl = document.getElementById("rl-time-small")
copy_rl = document.getElementById("copy-rl")
geturl = document.getElementById("geturl")
title = document.getElementById("title")

var overwriteTime = null
var overwriteRCTime = null

stopCustomURL = false

function getSetting(name) {
    options = JSON.parse(localStorage.getItem("options") || "{}")
    return options[name]
}

updateTime = async function() {
    

    if (overwriteTime) {
        var now = overwriteTime
        input.style.backgroundColor = "green"
        rl_date.style.backgroundColor = "#36393F"
    } else {
        var now = new Date;
    }

    var days_since_epoch = (now.getTime() - epoch.getTime() + epoch.getTimezoneOffset()*60000) / day_length_milliseconds

    rc_years = days_since_epoch / 30.4375
    rc_years_floor = Math.floor(rc_years)

    rc_months = (rc_years - rc_years_floor) * 12
    rc_months_floor = Math.floor(rc_months)

    rc_days = (rc_months - rc_months_floor) * 30.4375
    rc_days_floor = Math.floor(rc_days)

    rc_hours = (rc_days - rc_days_floor) * 24
    rc_hours_floor = Math.floor(rc_hours)

    rc_minutes = (rc_hours - rc_hours_floor) * 60
    rc_minutes_floor = Math.floor(rc_minutes)

    rc_seconds = (rc_minutes - rc_minutes_floor) * 60
    rc_seconds_floor = Math.floor(rc_seconds)

    // Set custom RC time from URL arguments
    if (URLParams.get("customDate") && !stopCustomURL) {
        

        if (URLParams.get("year")) {
            url_year = URLParams.get("year")
        } else {url_year = rc_years}
        if (URLParams.get("month")) {
            url_month = URLParams.get("month")
        } else {url_month = rc_months}
        if (URLParams.get("day")) {
            url_day = URLParams.get("day")
        } else {url_day = rc_days}
        if (URLParams.get("hour")) {
            url_hour = URLParams.get("hour")
        } else {url_hour = rc_hours}
        if (URLParams.get("minute")) {
            url_minute = URLParams.get("minute")
        } else {url_minute = rc_minutes}

        overwriteRCTime = new Date(
            url_year,
            url_month-1,
            url_day,
            url_hour,
            url_minute
        )
        overwriteRCTime.setFullYear(url_year)
        stopCustomURL = true 
        window.history.pushState(null, null, "/")
    }

    // Set RC time if overwritten
    if (overwriteRCTime) {
        rc_years_floor = overwriteRCTime.getYear()+1900
        rc_months_floor = overwriteRCTime.getMonth()
        rc_days_floor = overwriteRCTime.getDate()-1
        rc_hours_floor = overwriteRCTime.getHours()
        rc_minutes_floor = overwriteRCTime.getMinutes()
        rc_seconds_floor = overwriteRCTime.getSeconds()

        input.style.backgroundColor = "#36393F"
        rl_date.style.backgroundColor = "green"
    } 

    rc_date = new Date(rc_years_floor+1970, rc_months_floor, rc_days_floor+1, rc_hours_floor, rc_minutes_floor, rc_seconds_floor)
    
    // Change RL time if RC time is overwritten
    if (overwriteRCTime) {
        now = new Date(epoch.getTime() + rc_date.getTime()/12 - now.getTimezoneOffset()*60000)
        if (now.getTimezoneOffset() % 180 == 0 || [-480, 480, -330].includes(now.getTimezoneOffset())) {
            now = new Date(now.getTime() + 60*60*1000)
        }
    }

    // Update screen

    time.innerHTML = `Year ${rc_years_floor}, Month ${rc_months_floor+1}, Day ${rc_days_floor+1}, Hour ${rc_hours_floor}, Minute ${rc_minutes_floor}`
    if (!getSetting("hide_seconds")) {
        time.innerHTML += `, Second ${rc_seconds_floor}`
    }

    small_time = `${ordinal_suffix_of(rc_days_floor)} ${months[rc_months_floor]} ${rc_years_floor.toString().padStart(4, '0')}, ${rc_hours_floor.toString().padStart(2, '0')}:${rc_minutes_floor.toString().padStart(2, '0')}`

    if (small_time != time_small.innerHTML) {
        time_small.innerHTML = small_time
    }

    small_time_rl = `${ordinal_suffix_of(now.getDate())} ${months[now.getMonth()]} ${(now.getYear()+1900).toString().padStart(4, '0')}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    if (small_time_rl != time_small_rl.innerHTML) {
        time_small_rl.innerHTML = small_time_rl
    }

    rc_iso_time = `${rc_years_floor.toString().padStart(4, '0')}-${(rc_months_floor+1).toString().padStart(2, '0')}-${(rc_days_floor+1).toString().padStart(2, '0')}T${rc_hours_floor.toString().padStart(2, '0')}:${rc_minutes_floor.toString().padStart(2, '0')}`
        
    rl_date.value = rc_iso_time
    input.value = (new Date(now.getTime() - now.getTimezoneOffset()*60000)).toISOString().substring(0,16);

}

setInterval(updateTime, 80)

updateTime()

input.oninput = async function(e) {
    if (isNaN(e.target.valueAsNumber)) {
        overwriteTime = null
        input.style.backgroundColor = "#36393F"
    } else {
        d = new Date(e.target.valueAsNumber + new Date().getTimezoneOffset()*60000)
        overwriteTime = d 
    }
} 

rl_date.oninput = async function(e) {
    if (isNaN(e.target.valueAsNumber)) {
        overwriteRCTime = null
        stopCustomURL = true
        rl_date.style.backgroundColor = "#36393F"
        
    } else {
        d = new Date(e.target.valueAsNumber)
        overwriteRCTime = d 
    }
}

function copyText(text) {var input = document.createElement('input');input.setAttribute('value', text);
    document.body.appendChild(input);input.select();var result = document.execCommand('copy');document.body.removeChild(input);return result;}

copy.onclick = async function(e) {
    copy.style.backgroundColor = "#21822c"

    copyText(time_small.innerHTML)

    setTimeout(function () {
        copy.style.transition = "background-color 1s"
        copy.style.backgroundColor = "#36393F"

        setTimeout(function() {
            copy.style.transition = "filter .1s, border-radius .2s"
        }, 1000)
    }, 500)
}

geturl.onclick = async function(e) {
    geturl.style.backgroundColor = "#21822c"

    copyText(`${location.href}?customDate=true&year=${rc_years_floor}&month=${rc_months_floor+1}&day=${rc_days_floor}&hour=${rc_hours_floor}&minute=${rc_minutes_floor}`)

    setTimeout(function () {
        geturl.style.transition = "background-color 1s"
        geturl.style.backgroundColor = "#36393F"

        setTimeout(function() {
            geturl.style.transition = "filter .1s, border-radius .2s"
        }, 1000)
    }, 500)
}

copy_rl.onclick = async function(e) {
    copy_rl.style.backgroundColor = "#21822c"

    copyText(time_small_rl.innerHTML)

    setTimeout(function () {
        copy_rl.style.transition = "background-color 1s"
        copy_rl.style.backgroundColor = "#36393F"

        setTimeout(function() {
            copy_rl.style.transition = "filter .1s, border-radius .2s"
        }, 1000)
    }, 500)
}

show_seconds.oninput = async function(e) {
    if (!localStorage.getItem("options")) {
        localStorage.setItem("options", JSON.stringify({}))
    }
    options = JSON.parse(localStorage.getItem("options"))
    options.hide_seconds = !show_seconds.checked
    localStorage.setItem("options", JSON.stringify(options))
}

show_seconds.checked = !getSetting("hide_seconds")
resize = async function() {
    console.log(typeof window.innerWidth)

    if (window.innerWidth > 1000) {
        time.style.fontSize = window.innerHeight / 15.4
        time.style.top = `calc(50% - ${window.innerHeight / 5}px)`
        title.style.fontSize = window.innerHeight / 20
    } 

    if (window.innerWidth < 1200) {
        document.querySelectorAll(".button").forEach(el => el.style.padding = "")
        document.querySelectorAll(".time-small").forEach(el => el.style.fontSize = `${window.innerWidth / 45}px`)
        document.getElementById("rl-time-label").innerText = "RL time: "
        document.getElementById("rc-time-label").innerText = "RC time: "
    } else {
        document.getElementById("rl-time-label").innerText = "Real life time: "
        document.getElementById("rc-time-label").innerText = "RulerCraft time: "
        document.querySelectorAll(".time-small").forEach(el => el.style.fontSize = `30px`)
    }
    
}

window.onresize = resize

resize()