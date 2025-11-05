export type DataApiCommon = {
  dataSource: string;
  database: string;
  collection: string;
};

export type FindParams<TFilter = unknown> = DataApiCommon & {
  filter?: TFilter;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  projection?: Record<string, 0 | 1>;
};

export type InsertOneParams<T = unknown> = DataApiCommon & {
  document: T;
};

export type UpdateOneParams<
  TFilter = unknown,
  TUpdate = unknown
> = DataApiCommon & {
  filter: TFilter;
  update: TUpdate;
  upsert?: boolean;
};

export type BulkWriteParams = DataApiCommon & {
  operations: unknown[];
  ordered?: boolean;
};

type HttpHeaders = Record<string, string>;

export class MongoDataApi {
  private readonly appId: string;
  private readonly baseUrl: string;
  private readonly headers: HttpHeaders;

  constructor(opts: {
    appId: string;
    baseUrl?: string;
    apiKey?: string;
    accessToken?: string;
  }) {
    this.appId = opts.appId;
    this.baseUrl = opts.baseUrl || "https://data.mongodb-api.com/app";

    if (opts.apiKey) {
      this.headers = {
        "Content-Type": "application/json",
        apiKey: opts.apiKey,
      };
    } else if (opts.accessToken) {
      this.headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.accessToken}`,
      };
    } else {
      throw new Error("Provide either apiKey or accessToken");
    }
  }

  private endpoint(path: string): string {
    return `${this.baseUrl}/${this.appId}/endpoint/data/v1/action/${path}`;
  }

  async find<T = unknown>(params: FindParams): Promise<{ documents: T[] }> {
    const res = await fetch(this.endpoint("find"), {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!res.ok)
      throw new Error(`find failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async insertOne<T = unknown>(
    params: InsertOneParams<T>
  ): Promise<{ insertedId: string }> {
    const res = await fetch(this.endpoint("insertOne"), {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!res.ok)
      throw new Error(`insertOne failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async updateOne(params: UpdateOneParams): Promise<{
    matchedCount: number;
    modifiedCount: number;
    upsertedId?: string;
  }> {
    const res = await fetch(this.endpoint("updateOne"), {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!res.ok)
      throw new Error(`updateOne failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async bulkWrite(params: BulkWriteParams): Promise<unknown> {
    const res = await fetch(this.endpoint("bulkWrite"), {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!res.ok)
      throw new Error(`bulkWrite failed: ${res.status} ${await res.text()}`);
    return res.json();
  }
}
