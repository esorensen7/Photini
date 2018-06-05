//  Photini - a simple photo metadata editor.
//  http://github.com/jim-easterbrook/Photini
//  Copyright (C) 2018  Jim Easterbrook  jim@jim-easterbrook.me.uk
//
//  This program is free software: you can redistribute it and/or
//  modify it under the terms of the GNU General Public License as
//  published by the Free Software Foundation, either version 3 of the
//  License, or (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//  General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see
//  <http://www.gnu.org/licenses/>.

var drag_id = -1;
var map;
var markers = {};
var icon_on;
var icon_off;

function loadMap()
{
    L.mapbox.accessToken = initData.key;
    var streets = L.mapbox.tileLayer('mapbox.streets');
    var outdoors = L.mapbox.tileLayer('mapbox.outdoors');
    var satellite = L.mapbox.tileLayer('mapbox.satellite');
    map = L.mapbox.map(document.getElementById("mapDiv"), 'mapbox.outdoors', {
        center   : [initData.lat, initData.lng],
        zoom     : initData.zoom,
        maxZoom  : 18,
        tileLayer: false,
    });
    var baseMaps = {
        "Street"  : streets,
        "Outdoors": outdoors,
        "Aerial"  : satellite,
    };
    outdoors.addTo(map);
    L.control.layers(baseMaps).addTo(map);
    map.on('contextmenu', ignoreEvent);
    map.on('moveend zoomend', newBounds);
    icon_on = new L.Icon.Default();
    icon_off = new L.Icon({
        iconUrl: 'grey_marker.png', iconSize: [25, 40], iconAnchor: [13, 40]});
//    mapboxgl.accessToken = initData.key;
//    map = new mapboxgl.Map({
//        container: document.getElementById("mapDiv"),
//        style    : 'mapbox://styles/mapbox/streets-v9',
//        center   : [initData.lng, initData.lat],
//        zoom     : initData.zoom,
//    });
    python.initialize_finished();
    newBounds();
}

function ignoreEvent(event)
{
}

function newBounds(event)
{
    var centre = map.getCenter();
    var bounds = map.getBounds();
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
    python.new_status({
        centre: [centre.lat, centre.lng],
        bounds: [ne.lat, ne.lng, sw.lat, sw.lng],
        zoom: map.getZoom(),
        });
}

function setView(lat, lng, zoom)
{
    map.setView([lat, lng], zoom);
}

function adjustBounds(north, east, south, west)
{
    map.fitBounds([[north, east], [south, west]]);
}

function fitPoints(points)
{
    var bounds = L.latLngBounds(points);
    if (map.getBounds().contains(bounds))
        return;
    map.fitBounds(bounds, {
        paddingTopLeft: [15, 50], paddingBottomRight: [15, 10],
        maxZoom: map.getZoom()});
}

function enableMarker(id, active)
{
    var marker = markers[id];
    if (active)
    {
        marker.setZIndexOffset(1000);
        if (id != drag_id)
            marker.setIcon(icon_on);
    }
    else
    {
        marker.setZIndexOffset(0);
        marker.setIcon(icon_off);
    }
}

function addMarker(id, lat, lng, active)
{
    var marker = L.marker([lat, lng], {draggable: true, autoPan: true});
    marker.addTo(map);
    markers[id] = marker;
    marker.on('click', markerClick);
    marker.on('dragstart', markerDragStart);
    marker.on('drag', markerDrag);
    marker.on('dragend', markerDragEnd);
    enableMarker(id, active)
}

function markerToId(marker)
{
    for (var id in markers)
        if (markers[id] == marker)
            return id;
}

function markerClick(event)
{
    python.marker_click(markerToId(this));
}

function markerDragStart(event)
{
    // workaround for Leaflet bug #4484 - don't change marker image until end
    // of drag. https://github.com/Leaflet/Leaflet/issues/4484
    var id = markerToId(this);
    drag_id = id;
    python.marker_click(id);
}

function markerDrag(event)
{
    var loc = this.getLatLng();
    python.marker_drag(loc.lat, loc.lng, markerToId(this));
}

function markerDragEnd(event)
{
    var loc = this.getLatLng();
    var id = markerToId(this);
    python.marker_drag(loc.lat, loc.lng, id);
    drag_id = -1;
    python.marker_click(id);
}

function markerDrop(x, y)
{
    var position = map.containerPointToLatLng([x, y]);
    python.marker_drop(position.lat, position.lng);
}

function delMarker(id)
{
    map.removeLayer(markers[id]);
    delete markers[id];
}

function removeMarkers()
{
    for (var id in markers)
        markers[id].removeFrom(map);
    markers = {};
}
