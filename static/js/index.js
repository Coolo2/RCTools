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