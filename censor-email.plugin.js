/**
 * @name CensorEmail
 * @description Censors the user's email
 * @updateUrl none
 * @version 1.0
 * @author a18 corp.
 */

/**/

(function () {
    "use strict";
    setInterval(() => {
        if (!document.querySelector(".updated-settings-CensorEmail") && document.querySelector(".email-label-LXltS")){
            const sett = document.querySelector(".email-label-LXltS");

            let split = sett.textContent.split("@");
            let local = split[0].split("");   // turn into array of chars
            for (let i = 1; i < local.length - 1; i++) {
                local[i] = "*";
            }
            split[0] = local.join("");

            //document.querySelector("email-label-IFT0d").textContent = split[0] + "@" + split[1];
            sett.textContent = split[0] + "@" + split[1];
            sett.classList.add("updated-settings-CensorEmail");
            sett.style.visibility = "visible";
        }
        if (!document.querySelector(".updated-menu-CensorEmail") && document.querySelector(".email-label-IFT0d")){
            const menu = document.querySelector(".email-label-IFT0d");

            let split = menu.textContent.split("@");
            let local = split[0].split("");   // turn into array of chars
            for (let i = 1; i < local.length - 1; i++) {
                local[i] = "*";
            }
            split[0] = local.join("");

            //document.querySelector("email-label-IFT0d").textContent = split[0] + "@" + split[1];
            menu.textContent = split[0] + "@" + split[1];
            menu.classList.add("updated-menu-CensorEmail");
            menu.style.visibility = "visible";
        }
    }, 200);

    window.onload = function(){
        const style = document.createElement("style");
        style.innerHTML =
`.email-label-LXltS, .email-label-IFT0d{
    visibility: hidden;
}
`
        document.body.appendChild(style);
    }();
})();