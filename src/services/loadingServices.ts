// src/services/loadingService.ts
type LoadingCallback = (isLoading: boolean) => void;

class LoadingService {
  private static loadingCallback: LoadingCallback | null = null;

  static register(callback: LoadingCallback): void {
    LoadingService.loadingCallback = callback;
  }

  static show(): void {
    if (LoadingService.loadingCallback) {
      LoadingService.loadingCallback(true);
    }
  }

  static hide(): void {
    if (LoadingService.loadingCallback) {
      LoadingService.loadingCallback(false);
    }
  }
}

export default LoadingService;
