// types/global.d.ts
declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): this;
      unref(): this;
    }
  }
}

export {};




