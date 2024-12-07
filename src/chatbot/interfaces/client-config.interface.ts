export interface ClientConfig {
  clientId?: string; 
  settings: {
    language: string;
    timezone: string;
    activeModules: string[];
    [key: string]: any;
  };
}
