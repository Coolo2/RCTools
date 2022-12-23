
navbar = document.getElementById("navbar")
navbar_chevron = document.getElementById("navbar-chevron")

navbar_chevron.onclick = async function() {

    if (!window.localStorage.getItem("navbarClosed") || window.localStorage.getItem("navbarClosed") == "false") {
        window.localStorage.setItem("navbarClosed", true)
    } else {
        window.localStorage.setItem("navbarClosed", false)
    }
    await refreshNavbar()
}

document.getElementById("navbar-home").onclick = async function(e) {
    e.preventDefault()
    window.localStorage.setItem("navbarClosed", true)
    await refreshNavbar()
    setTimeout(async function() {
        window.open(document.getElementById("navbar-home").href, "_self")
    }, 500)
}

async function refreshNavbar() {
    children = Array.from(navbar.children).reverse();

    for (element of children) {
        if (element.classList.contains("navbar-item") ) {
            if (window.localStorage.getItem("navbarClosed") == null || window.localStorage.getItem("navbarClosed") == "false") {
                if (element.classList.contains("navbar-logo")) {
                    element.style.width = "35vw"
                } else {
                    element.style.width = "20vw"
                }
                navbar_chevron.children[0].children[0].style.transform = "rotate(180deg)"
                navbar_chevron.setAttribute("aria-label", "Collapse Navbar")
                
            } else {
                element.style.width = "0px"
                navbar_chevron.children[0].children[0].style.transform = "rotate(0deg)"
                navbar_chevron.setAttribute("aria-label", "Open Navbar")
            }
        }
    }
}
if (window.location.pathname == "/") {
    window.localStorage.setItem("navbarClosed", true)
}
refreshNavbar()

