/* "other transmissions" reveal — CSS handles hover/focus-within, this is
   just the touch fallback: iOS Safari doesn't reliably :hover or focus a
   tapped <button>, so give it an explicit click toggle too. */
(function () {
  var group = document.querySelector('.transmissions');
  var trigger = group && group.querySelector('.transmissions-trigger');
  if (!group || !trigger) return;

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    group.classList.toggle('open');
  });
  document.addEventListener('click', function (e) {
    if (!group.contains(e.target)) group.classList.remove('open');
  });
})();
