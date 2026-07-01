export function hapticLight() {
  if (navigator.vibrate) navigator.vibrate(8);
}

export function hapticMedium() {
  if (navigator.vibrate) navigator.vibrate(25);
}

export function hapticStrong() {
  if (navigator.vibrate) navigator.vibrate(50);
}
