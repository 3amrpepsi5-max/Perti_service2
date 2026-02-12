export function createMarkerIcon(vendor) {
  return L.divIcon({
    className: "custom-marker-wrapper",
    html: `
      <div class="custom-marker ${vendor.status}">
        <div class="marker-pulse"></div>
        <div class="marker-icon">
          <i class="fas fa-store"></i>
        </div>
        <div class="marker-label">${vendor.name}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
}