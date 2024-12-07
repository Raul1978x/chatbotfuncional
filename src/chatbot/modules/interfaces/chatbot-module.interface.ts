export interface ModuleExecutionContext {
  text: string;
  from: string;
  timestamp: string;
  key: {
    remoteJid: string;
    fromMe: boolean;
  };
  message: any;
  clientConfig: {
    settings: {
      language: string;
      timezone: string;
      activeModules: string[];
    };
  };
}

export interface ChatbotModule {
  execute(context: ModuleExecutionContext): Promise<string>;
}
