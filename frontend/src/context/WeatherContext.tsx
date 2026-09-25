import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  StormCell,
  TimelineHourForecast,
  Alert,
  LightningFlash,
  SystemHealthStatus,
  RegionInfo,
  CitizenGroundReport
} from '../types';
import * as api from '../services/api';
import { stepMockSimulation, generateMockLightning, INITIAL_STORM_CELLS, INITIAL_CITIZEN_REPORTS } from '../services/mockData';

interface LayerVisibility {
  radar: boolean;
  satellite: boolean;
  lightning: boolean;
  stormCells: boolean;
  hazardPolygons: boolean;
  vectors: boolean;
  radarEchoTops: boolean;
}

interface WeatherContextType {
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  regions: RegionInfo[];
  stormCells: StormCell[];
  selectedCell: StormCell | null;
  setSelectedCell: (cell: StormCell | null) => void;
  alerts: Alert[];
  lightningFlashes: LightningFlash[];
  forecast: TimelineHourForecast[];
  selectedForecastHour: number;
  setSelectedForecastHour: (hour: number) => void;
  isLiveSimulation: boolean;
  setIsLiveSimulation: (live: boolean) => void;
  simulationTick: number;
  isAudioAlertEnabled: boolean;
  setIsAudioAlertEnabled: (enabled: boolean) => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  triggerManualTick: () => Promise<void>;
  systemHealth: SystemHealthStatus | null;
  currentTimeStr: string;
  systemMode: 'LIVE_DATA' | 'SIMULATION';
  setSystemMode: (mode: 'LIVE_DATA' | 'SIMULATION') => Promise<void>;
  liveExternalData: any;
  citizenReports: CitizenGroundReport[];
  addCitizenReport: (report: {
    region: string;
    location_name: string;
    latitude: number;
    longitude: number;
    hazard_type: string;
    severity: string;
    user_note: string;
    reporter_name?: string;
  }) => Promise<CitizenGroundReport>;
  verifyCitizenReport: (reportId: string) => Promise<void>;
  upvoteCitizenReport: (reportId: string) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    return localStorage.getItem('varshanet_sector') || "Nagpur Sector (Vidarbha)";
  });
  const [systemMode, setSystemModeState] = useState<'LIVE_DATA' | 'SIMULATION'>('SIMULATION');
  const [liveExternalData, setLiveExternalData] = useState<any>(null);
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [stormCells, setStormCells] = useState<StormCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<StormCell | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lightningFlashes, setLightningFlashes] = useState<LightningFlash[]>([]);
  const [forecast, setForecast] = useState<TimelineHourForecast[]>([]);
  const [selectedForecastHour, setSelectedForecastHour] = useState<number>(0);
  const [isLiveSimulation, setIsLiveSimulation] = useState<boolean>(true);
  const [simulationTick, setSimulationTick] = useState<number>(0);
  const [isAudioAlertEnabled, setIsAudioAlertEnabled] = useState<boolean>(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [citizenReports, setCitizenReports] = useState<CitizenGroundReport[]>(INITIAL_CITIZEN_REPORTS);

  const [layers, setLayers] = useState<LayerVisibility>({
    radar: true,
    satellite: false,
    lightning: true,
    stormCells: true,
    hazardPolygons: true,
    vectors: true,
    radarEchoTops: false
  });

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Clock ticker for IST & UTC
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utc = now.toISOString().substring(11, 19) + ' UTC';
      const ist = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST';
      setCurrentTimeStr(`${ist} | ${utc}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [regs, cells, alts, fc, health, modeInfo] = await Promise.all([
        api.fetchRegions(),
        api.fetchStormCells(),
        api.fetchAlerts(),
        api.fetchForecast(selectedRegion),
        api.fetchSystemHealth(),
        api.fetchSystemMode()
      ]);
      setRegions(regs);
      const activeMode = modeInfo?.system_mode || 'SIMULATION';
      setSystemModeState(activeMode as any);
      setIsLiveSimulation(activeMode === 'SIMULATION');

      if (activeMode === 'LIVE_DATA') {
        setStormCells(cells);
        setSelectedCell(cells.length > 0 ? cells[0] : null);
        setLightningFlashes([]);
        try {
          const live = await api.fetchLiveExternalFeed(selectedRegion);
          setLiveExternalData(live);
        } catch (e) {
          // ignore
        }
      } else {
        const validCells = cells.length > 0 ? cells : INITIAL_STORM_CELLS;
        setStormCells(validCells);
        if (validCells.length > 0 && !selectedCell) {
          setSelectedCell(validCells[0]);
        }
        setLightningFlashes(generateMockLightning(validCells));
      }
      setAlerts(alts);
      setForecast(fc);
      setSystemHealth(health);

      try {
        const reps = await api.fetchCitizenReports(selectedRegion);
        if (reps && reps.length > 0) {
          setCitizenReports(reps);
        }
      } catch (e) {
        // use fallback initial citizen reports
      }
    } catch (err) {
      console.warn("Failed to load initial data", err);
    }
  }, [selectedRegion, selectedCell]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refresh forecast on region change
  useEffect(() => {
    api.fetchForecast(selectedRegion).then(fc => setForecast(fc));
  }, [selectedRegion]);

  // WebSocket Live Updates Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/live`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // ws connected
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'SIMULATION_TICK' || data.event === 'INITIAL_STATE') {
              if (data.tick_count !== undefined) {
                setSimulationTick(data.tick_count);
              }
              // Only apply simulation cells if in SIMULATION mode
              if (systemMode === 'SIMULATION') {
                if (data.active_cells) {
                  setStormCells(data.active_cells);
                  setSelectedCell(prev => {
                    if (!prev) return data.active_cells[0] || null;
                    const match = data.active_cells.find((c: StormCell) => c.cell_id === prev.cell_id);
                    return match || data.active_cells[0] || null;
                  });
                }
                if (data.lightning_flashes) {
                  setLightningFlashes(data.lightning_flashes);
                }
              }
              if (data.alerts) {
                setAlerts(data.alerts);
              }
              if (data.system_health) {
                setSystemHealth(data.system_health);
              }
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        ws.onerror = () => {
          // Fallback will step client simulation
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 6000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWs, 6000);
      }
    };

    connectWs();

    // Live client-side simulation loop every 3.5s if WebSocket is inactive (e.g. Vercel)
    const fallbackInterval = setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        if (isLiveSimulation && systemMode === 'SIMULATION') {
          setStormCells(prev => {
            const current = prev.length > 0 ? prev : INITIAL_STORM_CELLS;
            const { updatedCells, flashes } = stepMockSimulation(current);
            setLightningFlashes(flashes);
            setSelectedCell(sel => {
              if (!sel) return updatedCells[0] || null;
              const match = updatedCells.find(c => c.cell_id === sel.cell_id);
              return match || updatedCells[0] || null;
            });
            return updatedCells;
          });
          setSimulationTick(t => t + 1);
        }
      }
    }, 3500);

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(fallbackInterval);
    };
  }, [isLiveSimulation, systemMode]);

  const acknowledgeAlert = async (alertId: string) => {
    await api.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, status: 'acknowledged' } : a));
  };

  const triggerManualTick = async () => {
    if (systemMode === 'LIVE_DATA') {
      // In LIVE_DATA mode, manual tick refreshes genuine external telemetry
      try {
        const live = await api.fetchLiveExternalFeed(selectedRegion);
        setLiveExternalData(live);
        const fc = await api.fetchForecast(selectedRegion);
        setForecast(fc);
      } catch (e) {
        // offline
      }
      return;
    }

    try {
      await api.triggerSimulationTick();
    } catch (e) {
      // offline
    }
    setStormCells(prev => {
      const current = prev.length > 0 ? prev : INITIAL_STORM_CELLS;
      const { updatedCells, flashes } = stepMockSimulation(current);
      setLightningFlashes(flashes);
      setSelectedCell(sel => {
        if (!sel) return updatedCells[0] || null;
        const match = updatedCells.find(c => c.cell_id === sel.cell_id);
        return match || updatedCells[0] || null;
      });
      return updatedCells;
    });
    const fc = await api.fetchForecast(selectedRegion);
    setForecast(fc);
    setSimulationTick(t => t + 1);
  };

  const setSystemMode = async (mode: 'LIVE_DATA' | 'SIMULATION') => {
    setSystemModeState(mode);
    setIsLiveSimulation(mode === 'SIMULATION');
    try {
      await api.setSystemMode(mode);
    } catch (e) {
      // offline
    }
    if (mode === 'LIVE_DATA') {
      try {
        const live = await api.fetchLiveExternalFeed(selectedRegion);
        setLiveExternalData(live);
        const liveCells = await api.fetchStormCells();
        setStormCells(liveCells);
        setSelectedCell(liveCells.length > 0 ? liveCells[0] : null);
        setLightningFlashes([]);
      } catch (e) {
        console.warn("Live feed fetch failed", e);
      }
    } else {
      // Revert to SIMULATION mode: reload simulated active storm cells and lightning
      setStormCells(INITIAL_STORM_CELLS);
      setSelectedCell(INITIAL_STORM_CELLS[0]);
      setLightningFlashes(generateMockLightning(INITIAL_STORM_CELLS));
    }
  };

  const addCitizenReport = async (reportData: {
    region: string;
    location_name: string;
    latitude: number;
    longitude: number;
    hazard_type: string;
    severity: string;
    user_note: string;
    reporter_name?: string;
  }) => {
    const created = await api.submitCitizenReport(reportData);
    setCitizenReports(prev => [created, ...prev]);
    return created;
  };

  const verifyCitizenReport = async (reportId: string) => {
    await api.verifyCitizenReport(reportId);
    setCitizenReports(prev => prev.map(r => r.id === reportId ? { ...r, verified: true } : r));
  };

  const upvoteCitizenReport = async (reportId: string) => {
    await api.upvoteCitizenReport(reportId);
    setCitizenReports(prev => prev.map(r => r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r));
  };

  return (
    <WeatherContext.Provider
      value={{
        selectedRegion,
        setSelectedRegion,
        regions,
        stormCells,
        selectedCell,
        setSelectedCell,
        alerts,
        lightningFlashes,
        forecast,
        selectedForecastHour,
        setSelectedForecastHour,
        isLiveSimulation,
        setIsLiveSimulation,
        simulationTick,
        isAudioAlertEnabled,
        setIsAudioAlertEnabled,
        acknowledgeAlert,
        layers,
        toggleLayer,
        triggerManualTick,
        systemHealth,
        currentTimeStr,
        systemMode,
        setSystemMode,
        liveExternalData,
        citizenReports,
        addCitizenReport,
        verifyCitizenReport,
        upvoteCitizenReport
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
