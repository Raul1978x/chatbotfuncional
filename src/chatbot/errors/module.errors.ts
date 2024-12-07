export class ModuleNotFoundError extends Error {
  constructor(moduleName: string) {
    super(`Module ${moduleName} not found`);
    this.name = 'ModuleNotFoundError';
  }
}

export class ModuleNotActiveError extends Error {
  constructor(moduleName: string) {
    super(`Module ${moduleName} is not active for this client`);
    this.name = 'ModuleNotActiveError';
  }
}

export class ModuleDependencyError extends Error {
  constructor(moduleName: string, dependencyName: string) {
    super(`Module ${moduleName} requires dependency ${dependencyName} which is not available`);
    this.name = 'ModuleDependencyError';
  }
}

export class ModuleExecutionError extends Error {
  constructor(moduleName: string, originalError: Error) {
    super(`Error executing module ${moduleName}: ${originalError.message}`);
    this.name = 'ModuleExecutionError';
    this.stack = originalError.stack;
  }
}
