import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PickupZone, School } from '../types';
import { ZoneStatusBadge } from './ZoneStatusBadge';
import { MapPin, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ZoneMapCardProps {
  school: School;
  zones: PickupZone[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  height?: number | string;
  className?: string;
}

export const ZoneMapCard: React.FC<ZoneMapCardProps> = ({
  school,
  zones,
  selectedZoneId,
  onSelectZone,
  height = 360,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center around Vadapalani / Chennai school coordinates
      const map = L.map(mapContainerRef.current, {
        center: [school.lat, school.lng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Positron clean light basemap (matches blue & white design system)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // School Main Gate Pin
    const schoolIcon = L.divIcon({
      className: 'custom-gate-pin',
      html: `
        <div style="background-color: #1D4ED8; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 2px solid white; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <path d="M6 6h10"/>
            <path d="M6 10h10"/>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const schoolMarker = L.marker([school.lat, school.lng], { icon: schoolIcon }).addTo(map);
    schoolMarker.bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 12px; line-height: 1.4; color: #0F172A;">
        <div style="font-weight: 700; color: #1D4ED8;">${school.name}</div>
        <div style="font-size: 11px; color: #64748B;">Main Gate Bay (Holding Capacity: ${school.gateSideCapacity} vehicles)</div>
        <div style="margin-top: 4px; font-size: 10px; background: #EFF6FF; padding: 2px 6px; border-radius: 4px; color: #1E40AF;">
          Queue spillback occurs beyond 8 vehicles
        </div>
      </div>
    `);
    markersRef.current['school'] = schoolMarker;

    // Pickup Zone Pins
    zones.forEach((zone) => {
      const isSelected = selectedZoneId === zone.id;
      const isOverCap = zone.isOverCapacity;
      const isVerified = zone.legalSafetyVerified;

      const bgColor = isOverCap ? '#DC2626' : isSelected ? '#1D4ED8' : '#2563EB';

      const zoneIcon = L.divIcon({
        className: `custom-zone-pin-${zone.id}`,
        html: `
          <div style="background-color: ${bgColor}; color: white; padding: 4px 8px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); border: 2px solid white; display: flex; align-items: center; gap: 4px; font-weight: 600; font-size: 11px; font-family: Inter, sans-serif; white-space: nowrap;">
            <span>${zone.code}</span>
            <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 3px; font-size: 10px;">
              ${zone.assignedVehicleCount}/${zone.capacityVehicles}
            </span>
          </div>
        `,
        iconSize: [60, 26],
        iconAnchor: [30, 13],
      });

      const zoneMarker = L.marker([zone.lat, zone.lng], { icon: zoneIcon }).addTo(map);
      zoneMarker.on('click', () => {
        if (onSelectZone) onSelectZone(zone.id);
      });

      const vehicleLabels = zone.allowedVehicleTypes
        .map((t) => t.replace('_', ' '))
        .join(', ');

      zoneMarker.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px; line-height: 1.4; color: #0F172A; min-width: 180px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-weight: 700; color: #1D4ED8;">${zone.code}: ${zone.name}</span>
            <span style="font-size: 9px; font-weight: 600; padding: 1px 5px; border-radius: 4px; ${
              isVerified ? 'background: #DCFCE7; color: #166534;' : 'background: #FEF3C7; color: #92400E;'
            }">
              ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}
            </span>
          </div>
          <div style="font-size: 11px; color: #64748B; margin-top: 3px;">${zone.description}</div>
          <div style="margin-top: 6px; border-top: 1px solid #E2E8F0; padding-top: 4px; font-size: 11px;">
            <div><strong>Usable Length:</strong> ${zone.usableLengthMeters} meters</div>
            <div><strong>Allowed:</strong> ${vehicleLabels}</div>
            <div><strong>Capacity:</strong> ${zone.capacityVehicles} vehicles concurrent</div>
            <div><strong>Assigned Demand:</strong> ${zone.assignedVehicleCount} vehicles</div>
            ${
              isOverCap
                ? '<div style="color: #DC2626; font-weight: 600; margin-top: 4px;">⚠️ Over-capacity assignment!</div>'
                : '<div style="color: #166534; font-size: 10px; margin-top: 4px;">✓ Within safe kerbside capacity</div>'
            }
          </div>
        </div>
      `);

      markersRef.current[zone.id] = zoneMarker;
    });

    // Invalidate size to ensure crisp rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [school, zones, selectedZoneId]);

  return (
    <div className={`relative bg-white rounded-xl border border-blue-100 overflow-hidden ${className}`}>
      <div
        ref={mapContainerRef}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className="w-full relative z-0"
      />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm p-2.5 rounded-lg border border-blue-100 shadow-sm text-xs text-slate-700 flex flex-col gap-1.5 max-w-xs">
        <div className="font-semibold text-slate-900 flex items-center justify-between gap-3 text-[11px]">
          <span>Interactive Gate Map</span>
          <span className="text-[10px] text-blue-700 font-normal">Leaflet GIS</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-700" />
          <span>School Gate & Bay (Holds 8 queueing veh)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded bg-blue-600" />
          <span>Candidate Pickup Zones (A, B, C)</span>
        </div>
      </div>
    </div>
  );
};
