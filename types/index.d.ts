import { Application } from "@feathersjs/feathers";

// TypeScript Version: 4.0
export interface SyncOptions {
  key?: string;
  uri: string;
  deserialize?: (data: any) => any;
  serialize?: (data: any) => any;
}

export function init(options: SyncOptions): (app: Application) => void;
export function redis(options: any): (app: Application) => void;
export function amqp(options: any): (app: Application) => void;
export function rabbitmq(options: any): (app: Application) => void;
export function nats(options: any): (app: Application) => void;
export const SYNC: symbol;

export default init;
