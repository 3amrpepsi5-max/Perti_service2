import SocketManager from "./live-map-socket.js";
import { createMarkerIcon } from "./map-markers.js";
import zonePolygon from "../data/zone-polygon.json";

class LiveMap {
  constructor(containerId) {
    this.map = L.map(containerId, {
      center: [30.139785, 31.381158],
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    this.markers = new Map();
    this.addTiles();
    this.addZone();
    this.initSocket();
  }

  addTiles() {
    L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(this.map);
  }

  addZone() {
    L.geoJSON(zonePolygon, {
      style: {
        color: "#00ff88",
        weight: 3,
        fillColor: "#00ff88",
        fillOpacity: 0.1,
        dashArray: "8,6"
      }
    }).addTo(this.map);
  }

  initSocket() {
    const manager = new SocketManager();
    const socket = manager.connect();

    socket.on("vendor:online", vendor => {
      this.addOrUpdate(vendor);
    });

    socket.on("map:update", data => {
      const marker = this.markers.get(data.vendorId);
      if (marker) marker.setLatLng([data.lat, data.lng]);
    });

    socket.on("vendor:offline", id => {
      const marker = this.markers.get(id);
      if (marker) marker.remove();
    });
  }

  addOrUpdate(vendor) {
    if (this.markers.has(vendor.id)) return;

    const marker = L.marker(
      [vendor.lat, vendor.lng],
      { icon: createMarkerIcon(vendor) }
    ).addTo(this.map);

    this.markers.set(vendor.id, marker);
  }
}

export default LiveMap;