import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Country } from '../models/country.model';

const API_URL = 'https://restcountries.com/v3.1/all?fields=name,capital,region,subregion,flags,cca2,translations';
const CACHE_KEY = 'flagstreak_countries';
const CACHE_VERSION = 2; // increment when Country model structure changes
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private http = inject(HttpClient);
  private _countries: Country[] | null = null;

  getAll(): Observable<Country[]> {
    if (this._countries) {
      return of(this._countries);
    }

    const cached = this.loadFromCache();
    if (cached) {
      this._countries = cached;
      return of(cached);
    }

    return this.http.get<any[]>(API_URL).pipe(
      map(raw => raw
        .filter(c => c.name?.common && c.flags?.svg)
        .map(c => this.mapCountry(c))
        .sort((a, b) => a.name.localeCompare(b.name, 'en'))
      ),
      tap(countries => {
        this._countries = countries;
        this.saveToCache(countries);
      }),
      catchError(() => of([]))
    );
  }

  private mapCountry(raw: any): Country {
    return {
      name: raw.name.common,
      nameEs: raw.translations?.spa?.common ?? undefined,
      cca2: raw.cca2?.toLowerCase() ?? '',
      capital: raw.capital?.[0] ?? 'N/A',
      region: raw.region ?? 'Unknown',
      subregion: raw.subregion ?? raw.region ?? 'Unknown',
      flagSvg: raw.flags?.svg ?? `https://flagcdn.com/${raw.cca2?.toLowerCase()}.svg`,
      flagPng: raw.flags?.png ?? `https://flagcdn.com/w320/${raw.cca2?.toLowerCase()}.png`,
      flagAlt: raw.flags?.alt ?? `Flag of ${raw.name.common}`,
    };
  }

  private loadFromCache(): Country[] | null {
    try {
      const item = localStorage.getItem(CACHE_KEY);
      if (!item) return null;
      const { version, timestamp, data } = JSON.parse(item);
      if (version !== CACHE_VERSION) return null;
      if (Date.now() - timestamp > CACHE_TTL) return null;
      return data;
    } catch {
      return null;
    }
  }

  private saveToCache(countries: Country[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, timestamp: Date.now(), data: countries }));
    } catch {
      // storage full — ignore
    }
  }
}
