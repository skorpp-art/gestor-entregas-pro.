
export interface DeliveryRecord {
  id: string;
  driverName: string;
  locality: string;
  isFullLocality: boolean;
  isSubstitute: boolean;
  parties: string[];
  systemPackages: number;
  offSystemPackages: number;
  isComplicated: boolean;
  observations: string;
}

export interface Worksheet {
  id: string;
  date: string;
  records: DeliveryRecord[];
}

export interface DriverLocalityMap {
  [driverName: string]: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface TitularDriver {
  id: string;
  name: string;
  locality: string;
}