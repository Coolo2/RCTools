$('.info-box').tilt({
    maxTilt: 3
})

document.onclick = async function(e) {
    if (e.target.hasAttribute("openNavbar")) {
        e.preventDefault()
        window.localStorage.setItem("navbarClosed", false)
        await refreshNavbar()
        setTimeout(async function() {
            window.open(e.target.href || e.target.parentElement.href, "_self")
        }, 500)
    }
}

async function resize() {
    if (window.innerWidth < 1200) {
        document.querySelectorAll(".info-box").forEach(element => {
            element.style.width = "80%"
        })
    } else {
        document.querySelectorAll(".info-box").forEach(element => {
            element.style.width = "calc(33% - 50px)"
        })
    }
}
resize()
window.onresize = resize