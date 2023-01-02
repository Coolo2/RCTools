const URLParams = new URLSearchParams(window.location.search)

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {return i + "st";};if (j == 2 && k != 12) {return i + "nd";};if (j == 3 && k != 13) {return i + "rd";};return i + "th";
}
months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const day_length_milliseconds = 24 * 60 * 60 * 1000;
const epoch = new Date(2022, 0, 1);

// HTML elements

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
sun = document.getElementById("sun")

var overwriteTime = null
var overwriteRCTime = null

stopCustomURL = false

function getSetting(name) {
    options = JSON.parse(localStorage.getItem("options") || "{}")
    return options[name]
}

var startTime
var rc_date 
var updateOffset = 80
var rc_time_overwrite
var rl_time_overwrite
var start_rc_date

async function urlParams() {
    // Set custom RC time from URL arguments
    if (URLParams.get("customDate")) {

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
        
        //http:localhost:8000/time?customDate=true&year=11&month=12&day=20&hour=19&minute=39
        d = new Date(
            url_year,
            url_month-1,
            url_day,
            url_hour,
            url_minute
        )
        d.setFullYear(url_year)
        stopCustomURL = true 
        window.history.pushState(null, null, "/time")

        clearInterval(i);

        r = await fetch(`/api/time/convert?rctime=${encodeURIComponent(formatDate(d))}`)
        j = await r.json()

        input.style.backgroundColor = "#36393F"
        rl_date.style.backgroundColor = "green"

        rc_time_overwrite = d
        rl_time_overwrite = new Date(new Date(j.time).getTime() - new Date().getTimezoneOffset()*60000) 

        input.value = rl_time_overwrite.toISOString().substring(0,16);
        await updateTime()
        
    }
}


updateTime = async function() {

    if (rc_time_overwrite) {
        var now = rl_time_overwrite;
        
        rc_date = rc_time_overwrite
        
    } else {
        var now = new Date;
        input.value = now.toISOString().substring(0,16);

        if (!start_rc_date) {
            start_rc_date = "h"
            startTime = new Date

            r = await fetch("/api/time")
            try{j = await r.json()} catch {clearInterval(i)}
            start_rc_date = new Date(j.time)
        }

        diff = (new Date().getTime() - startTime.getTime())
        rc_date = new Date(start_rc_date.getTime() + diff*12)
    }

    // Split RC time into vars
    
    rc_years_floor = rc_date.getYear()+1900
    rc_months_floor = rc_date.getMonth()
    rc_days_floor = rc_date.getDate()-1
    rc_hours_floor = rc_date.getHours()
    rc_minutes_floor = rc_date.getMinutes()
    rc_seconds_floor = rc_date.getSeconds()

    // Update the background graphic

    seconds_through_day = rc_date.getSeconds() + (rc_date.getMinutes() * 60) + (rc_date.getHours() * 3600)

    alg = window.innerHeight - ( ((window.innerHeight*1.5/(86400-18000-25200)) * (seconds_through_day - 25200)) )
    if (alg < 0) {sunTop = (0-alg)-100} else {sunTop = alg}

    document.getElementById("background-day").style.background = `linear-gradient(to bottom, #94c5f8 1%,#a6e6ff ${sunTop}px,#b1b5ea 100%)`
    document.getElementById("background-sunrise").style.background = `linear-gradient(to bottom, #40405c 0%,#6f71aa ${sunTop}px,#8a76ab 100%)`
    document.getElementById("background-sunset").style.background = `linear-gradient(to bottom, #154277 0%,#576e71 ${sunTop-200}px,#e1c45e ${sunTop+20}px,#b26339 100%)`


    document.getElementById("background-night-am").style.opacity = 1 - (seconds_through_day) / 84600
    if (seconds_through_day > 20000) {document.getElementById("background-sunrise").style.opacity = 1 - (seconds_through_day - 25200) / 36000} else {document.getElementById("background-sunrise").style.opacity = 0}
    document.getElementById("background-day").style.opacity = (seconds_through_day - 25200) / 36000
    document.getElementById("background-sunset").style.opacity = (seconds_through_day - 61200) / 10000
    document.getElementById("background-night-pm").style.opacity = (seconds_through_day - 75000) / 10000

    sun.style.top = sunTop

    // Update on-screen time

    time.innerHTML = `Year ${rc_years_floor}, Month ${rc_months_floor+1}, Day ${rc_days_floor+1}, Hour ${rc_hours_floor}, Minute ${rc_minutes_floor}`
    if (getSetting("show_seconds")) {
        time.innerHTML += `, Second ${rc_seconds_floor}`
    }

    small_time = `${ordinal_suffix_of(rc_days_floor+1)} ${months[rc_months_floor]} ${rc_years_floor.toString().padStart(4, '0')}, ${rc_hours_floor.toString().padStart(2, '0')}:${rc_minutes_floor.toString().padStart(2, '0')}`

    if (small_time != time_small.innerHTML) {
        time_small.innerHTML = small_time
    }

    small_time_rl = `${ordinal_suffix_of(now.getDate())} ${months[now.getMonth()]} ${(now.getYear()+1900).toString().padStart(4, '0')}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    if (small_time_rl != time_small_rl.innerHTML) {
        time_small_rl.innerHTML = small_time_rl
    }

    rc_iso_time = `${rc_years_floor.toString().padStart(4, '0')}-${(rc_months_floor+1).toString().padStart(2, '0')}-${(rc_days_floor+1).toString().padStart(2, '0')}T${rc_hours_floor.toString().padStart(2, '0')}:${rc_minutes_floor.toString().padStart(2, '0')}`
        
    rl_date.value = rc_iso_time
    

}

var i = setInterval(updateTime, updateOffset)
urlParams()


input.oninput = async function(e) {
    // Inputted Real Life date to be converted to a RC date
    if (isNaN(e.target.valueAsNumber)) {
        rc_time_overwrite = null
        rc_time_overwrite = null
        input.style.backgroundColor = "#36393F"
        i = setInterval(updateTime, updateOffset)
    } else {
        clearInterval(i);
        d = new Date(e.target.valueAsNumber + new Date().getTimezoneOffset()*60000)

        input.style.backgroundColor = "green"
        rl_date.style.backgroundColor = "#36393F"
        
        r = await fetch(`/api/time/convert?rltime=${encodeURIComponent(formatDate(d))}`)
        j = await r.json()
        
        rl_time_overwrite = d
        rc_time_overwrite = new Date(j.time)
        await updateTime()
    }
} 

rl_date.oninput = async function(e) {
    // Inputted RC date to be converted to a Real Life date
    if (isNaN(e.target.valueAsNumber)) {
        rc_time_overwrite = null
        rc_time_overwrite = null
        stopCustomURL = true
        rl_date.style.backgroundColor = "#36393F"
        i = setInterval(updateTime, updateOffset)
        
    } else {
        clearInterval(i);

        d = new Date(e.target.valueAsNumber)
        r = await fetch(`/api/time/convert?rctime=${encodeURIComponent(formatDate(d))}`)
        j = await r.json()

        input.style.backgroundColor = "#36393F"
        rl_date.style.backgroundColor = "green"

        rc_time_overwrite = d
        rl_time_overwrite = new Date(new Date(j.time).getTime() - new Date().getTimezoneOffset()*60000) 

        input.value = rl_time_overwrite.toISOString().substring(0,16);
        await updateTime()
    }
}

function copyText(text) {var input = document.createElement('input');input.setAttribute('value', text);
    document.body.appendChild(input);input.select();var result = document.execCommand('copy');document.body.removeChild(input);return result;}

copy.onclick = async function(e) {
    // RC time copy button
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
    // RC copy url button
    geturl.style.backgroundColor = "#21822c"

    copyText(`${location.href}?customDate=true&year=${rc_years_floor}&month=${rc_months_floor+1}&day=${rc_days_floor+1}&hour=${rc_hours_floor}&minute=${rc_minutes_floor}`)

    setTimeout(function () {
        geturl.style.transition = "background-color 1s"
        geturl.style.backgroundColor = "#36393F"

        setTimeout(function() {
            geturl.style.transition = "filter .1s, border-radius .2s"
        }, 1000)
    }, 500)
}

copy_rl.onclick = async function(e) {
    // Real Life time copy
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
    // Show seconds checkbox 

    if (!localStorage.getItem("options")) {
        localStorage.setItem("options", JSON.stringify({}))
    }
    options = JSON.parse(localStorage.getItem("options"))
    options.show_seconds = show_seconds.checked
    localStorage.setItem("options", JSON.stringify(options))
}

show_seconds.checked = getSetting("show_seconds")
resize = async function() {
    // Window size handler

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