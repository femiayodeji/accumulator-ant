declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        init(): Promise<void>;
        environment?: string;
        data?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'>;
      };
    };
  }
}

export {};
