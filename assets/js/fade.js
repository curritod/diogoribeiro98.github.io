function fadeInPage() {
    if (!window.AnimationEvent) { return; }
    var fader = document.getElementById('fader');
    fader.classList.add('fade-out');    
}

document.addEventListener('DOMContentLoaded', function() {
  if (!window.AnimationEvent) { return; }
 var anchors = document.getElementsByTagName('a');
    
    for (var idx=0; idx<anchors.length; idx+=1) {
 if (anchors[idx].hostname !== window.location.hostname ||
            anchors[idx].pathname === window.location.pathname) {
            continue;
        }

  anchors[idx].addEventListener('click', function(event) {
            var fader = document.getElementById('fader'),
                anchor = event.currentTarget;
            
            var listener = function() {
                window.location = anchor.href;
                fader.removeEventListener('animationend', listener);
            };
            fader.addEventListener('animationend', listener);
            
            event.preventDefault();
 fader.classList.add('fade-in');
        });
    }
});

window.addEventListener('pageshow', function (event) {
  if (!event.persisted) {
    return;
  }
  var fader = document.getElementById('fader');
  fader.classList.remove('fade-in');
});

document.addEventListener("DOMContentLoaded", () => {
  // Normalize current path (remove trailing slash)
  const currentPath = window.location.pathname.replace(/\/$/, "");

  document.querySelectorAll(".nav-link").forEach(link => {
    // Normalize link target path
    const linkPath = new URL(link.href).pathname.replace(/\/$/, "");

    // If same path, prevent reload
    if (linkPath === currentPath) {
      link.addEventListener("click", e => {
        e.preventDefault();
        console.log(`Already on ${linkPath}, not reloading.`);
      });
    }
  });
});
