/* eslint-disable */
import type { PrismaClient } from '../../generated/prisma/client';

type PrismaConstructorOptions = {
  datasourceUrl?: string;
};

export type ConfigureReplicaCallback = (client: PrismaClient) => PrismaClient;
interface PrismaClientConstructor {
  new (options?: PrismaConstructorOptions): PrismaClient;
}

export type ReplicaManagerOptions =
  | {
      clientConstructor: PrismaClientConstructor;
      replicaUrls: string[];
      configureCallback: ConfigureReplicaCallback | undefined;
    }
  | {
      replicas: PrismaClient[];
    };

export class ReplicaManager {
  private _replicaClients: PrismaClient[];

  constructor(options: ReplicaManagerOptions) {
    if ('replicas' in options) {
      this._replicaClients = options.replicas;
      return;
    }

    const { replicaUrls, clientConstructor, configureCallback } = options;
    this._replicaClients = replicaUrls.map(datasourceUrl => {
      const client = new clientConstructor({
        datasourceUrl,
      });

      if (configureCallback) {
        return configureCallback(client);
      }
      return client;
    });
  }

  async connectAll() {
    await Promise.all(this._replicaClients.map(client => client.$connect()));
  }

  async disconnectAll() {
    await Promise.all(this._replicaClients.map(client => client.$disconnect()));
  }

  pickReplica(): PrismaClient {
    return this._replicaClients[
      Math.floor(Math.random() * this._replicaClients.length)
    ]!;
  }
}
