/**
 * @name FixEnhancedSettingsButton
 * @description Fixes the enhanced settings button from not selecting correctly
 * @updateUrl none
 * @version 1.0
 * @author a18 corp.
 */
(function () {
    "use strict";
    setInterval(() => {
        document.querySelectorAll(".button-DNmYL.button-container-zVLH6").forEach((elem) => {
            if (!document.querySelectorAll(".updated-FixEnhancedSettingsButton").length){
                elem.addEventListener("click", (e) => {
                document.querySelectorAll(".button-DNmYL.button-container-zVLH6").forEach((e) => {
                    if (e != elem){
                        e.classList.remove("selected-S7SeK");
                        let i = 0;
                        setInterval(() => {
                            i++;
                            if (i == 10)
                            e.classList.remove("selected-S7SeK");
                            
                        }, 20);
                        e.style.opacity = "0.4";
                        e.style.fontWeight = 500;
                    } else {
                        e.style.opacity = "0.9";
                        e.style.fontWeight = 600;
                        e.style.border = "none";
                        e.style.outline = "none";
                    }
                });
            });
        }
        setTimeout(() => {
        elem.classList.add("updated-FixEnhancedSettingsButton");    
        }, 500);
    });
    }, 200);
})();