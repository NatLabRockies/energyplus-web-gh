import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { allRegions } from '@constants/region';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { WeatherService } from '../weather.service';

const GEOJSON_URL = 'https://raw.githubusercontent.com/NREL/EnergyPlus/87ed9199d49e60b2e95f3927ed372ffb57ba9417/weather/master.geojson';
const LINK_KEYS = ['epw', 'ddy', 'stat', 'all', 'dir'];

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss']
})

export class WeatherComponent implements AfterViewInit, OnDestroy {
  @ViewChild('geomap') mapElement!: ElementRef<HTMLDivElement>;
  readonly allRegions = allRegions;
  keyword: FormControl;
  private map?: L.Map;

  constructor(
    public weatherService: WeatherService,
    private router: Router
  ) {
    this.keyword = new FormControl('', [Validators.required]);
  }

  ngAfterViewInit(): void {
    const map = L.map(this.mapElement.nativeElement, { preferCanvas: true, worldCopyJump: true }).setView([20, 0], 2);
    this.map = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    fetch(GEOJSON_URL)
      .then(res => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        if (this.map !== map) return;
        const clusters = L.markerClusterGroup({ chunkedLoading: true });
        L.geoJSON(data, {
          pointToLayer: (_feature, latlng) => L.circleMarker(latlng, {
            radius: 5, color: '#1c4e80', weight: 1, fillColor: '#3b8bd9', fillOpacity: 0.8
          }),
          onEachFeature: (feature, layer) => layer.bindPopup(() => this.buildPopup(feature.properties ?? {}))
        }).addTo(clusters);
        clusters.addTo(map);
      })
      .catch(err => console.error('Failed to load weather map data', err));
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
  }

  // Properties contain raw <a> HTML; extract hrefs and build DOM rather than injecting it.
  private buildPopup(props: Record<string, string>): HTMLElement {
    const container = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = props['title'] ?? '';
    container.appendChild(title);
    for (const key of LINK_KEYS) {
      const doc = new DOMParser().parseFromString(props[key] ?? '', 'text/html');
      const anchor = doc.querySelector('a');
      const href = anchor?.getAttribute('href');
      if (!href || !/^https:\/\//i.test(href)) continue;
      const link = document.createElement('a');
      link.href = href;
      link.textContent = anchor?.textContent ?? key;
      container.appendChild(document.createElement('br'));
      container.appendChild(link);
    }
    return container;
  }

  floor(i: number): number {
    return Math.floor(i / 10) * 10;
  }

  search(keyword: string): void {
    this.router.navigate(['/weather-search', keyword.trim()]);
  }
}
