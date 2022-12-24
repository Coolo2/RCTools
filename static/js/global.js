function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


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
                    element.style.width = "25vw"
                } else {
                    element.style.width = "15vw"
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

