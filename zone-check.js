import zonePolygon from '../data/zone-polygon.json';

export function isInsideZone(lat, lng) {
  const polygon = zonePolygon.features[0].geometry.coordinates[0];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect =
      ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

export function distanceToZone(lat, lng) {
  const polygon = zonePolygon.features[0].geometry.coordinates[0];
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length - 1; i++) {
    const d = haversine(
      lat, lng,
      polygon[i][1], polygon[i][0]
    );
    minDistance = Math.min(minDistance, d);
  }

  return minDistance;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon/2)**2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export function showOutOfZoneMessage(distance) {
  const modal = document.createElement('div');
  modal.className = 'zone-warning-modal';
  modal.innerHTML = `
    <div class="zone-warning-content">
      <div class="warning-icon">⚠️</div>
      <h2>أنت خارج نطاق الخدمة</h2>
      <p>يبعد موقعك ${distance.toFixed(2)} كم عن المنطقة</p>
      <button onclick="this.closest('.zone-warning-modal').remove()">حسناً</button>
    </div>
  `;
  document.body.appendChild(modal);
}

export function checkUserLocation() {
  if (!navigator.geolocation) return Promise.resolve(true);

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const inside = isInsideZone(latitude, longitude);
        if (!inside) {
          const d = distanceToZone(latitude, longitude);
          showOutOfZoneMessage(d);
        }
        resolve(inside);
      },
      () => resolve(true),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}