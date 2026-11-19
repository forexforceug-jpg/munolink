import { apiRequest, backendUrl, uploadBinary, ApiError } from "./api";
import { decode } from "base64-arraybuffer";

type QueryError = {
  message: string;
  code?: string;
};

type QueryResult<T = any> = {
  data: T | null;
  error: QueryError | null;
  count: number | null;
};

type Filter = {
  column: string;
  operator: string;
  value?: unknown;
  negate?: boolean;
};

type QueryBody = {
  table: string;
  operation: "select" | "insert" | "upsert" | "update" | "delete";
  select: string;
  filters: Filter[];
  orGroups: Filter[][];
  values?: unknown;
  order: { column: string; ascending: boolean }[];
  limit: number;
  offset: number;
  count: boolean;
  head: boolean;
  returning: boolean;
  cardinality: "many" | "single" | "maybeSingle";
  onConflict?: string;
  ignoreDuplicates: boolean;
};

class BackendQueryBuilder implements PromiseLike<QueryResult> {
  private readonly body: QueryBody;

  constructor(table: string) {
    this.body = {
      table,
      operation: "select",
      select: "*",
      filters: [],
      orGroups: [],
      order: [],
      limit: 100,
      offset: 0,
      count: false,
      head: false,
      returning: false,
      cardinality: "many",
      ignoreDuplicates: false,
    };
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }): this {
    this.body.select = columns;
    this.body.returning = this.body.operation !== "select";
    this.body.count = options?.count === "exact";
    this.body.head = options?.head ?? false;
    return this;
  }

  insert(values: unknown): this {
    this.body.operation = "insert";
    this.body.values = values;
    return this;
  }

  upsert(
    values: unknown,
    options?: { onConflict?: string; ignoreDuplicates?: boolean },
  ): this {
    this.body.operation = "upsert";
    this.body.values = values;
    this.body.onConflict = options?.onConflict;
    this.body.ignoreDuplicates = options?.ignoreDuplicates ?? false;
    return this;
  }

  update(values: Record<string, unknown>): this {
    this.body.operation = "update";
    this.body.values = values;
    return this;
  }

  delete(): this {
    this.body.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    return this.addFilter(column, "eq", value);
  }

  neq(column: string, value: unknown): this {
    return this.addFilter(column, "neq", value);
  }

  gt(column: string, value: unknown): this {
    return this.addFilter(column, "gt", value);
  }

  gte(column: string, value: unknown): this {
    return this.addFilter(column, "gte", value);
  }

  lt(column: string, value: unknown): this {
    return this.addFilter(column, "lt", value);
  }

  lte(column: string, value: unknown): this {
    return this.addFilter(column, "lte", value);
  }

  like(column: string, value: string): this {
    return this.addFilter(column, "like", value);
  }

  ilike(column: string, value: string): this {
    return this.addFilter(column, "ilike", value);
  }

  is(column: string, value: unknown): this {
    return this.addFilter(column, "is", value);
  }

  in(column: string, values: readonly unknown[]): this {
    return this.addFilter(column, "in", [...values]);
  }

  not(column: string, operator: string, value: unknown): this {
    return this.addFilter(column, operator, value, true);
  }

  filter(column: string, operator: string, value: unknown): this {
    return this.addFilter(column, operator, value);
  }

  match(values: Record<string, unknown>): this {
    for (const [column, value] of Object.entries(values)) {
      this.eq(column, value);
    }
    return this;
  }

  or(expression: string): this {
    this.body.orGroups.push(parseOrGroup(expression));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.body.order.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  limit(count: number): this {
    this.body.limit = count;
    return this;
  }

  range(from: number, to: number): this {
    this.body.offset = from;
    this.body.limit = Math.max(0, to - from + 1);
    return this;
  }

  single(): this {
    this.body.cardinality = "single";
    return this;
  }

  maybeSingle(): this {
    this.body.cardinality = "maybeSingle";
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(
      onfulfilled ?? undefined,
      onrejected ?? undefined,
    );
  }

  private addFilter(
    column: string,
    operator: string,
    value: unknown,
    negate = false,
  ): this {
    this.body.filters.push({
      column,
      operator,
      value,
      ...(negate ? { negate } : {}),
    });
    return this;
  }

  private async execute(): Promise<QueryResult> {
    try {
      return await apiRequest<QueryResult>("/data/query", {
        method: "POST",
        body: this.body,
      });
    } catch (error) {
      return {
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Backend data request failed.",
          code: error instanceof ApiError ? String(error.status) : undefined,
        },
        count: null,
      };
    }
  }
}

function splitFilterExpression(expression: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < expression.length; index += 1) {
    if (expression[index] === "(") depth += 1;
    if (expression[index] === ")") depth -= 1;
    if (expression[index] === "," && depth === 0) {
      parts.push(expression.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(expression.slice(start).trim());
  return parts.filter(Boolean);
}

function parseOrGroup(expression: string): Filter[] {
  const value = expression.trim().replace(/^\((.*)\)$/s, "$1");
  return splitFilterExpression(value).map((clause) => {
    const match = clause.match(
      /^([a-z_][a-z0-9_]*)\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.*)$/i,
    );
    if (!match) throw new Error("Unsupported backend OR filter.");
    let filterValue: unknown = match[3];
    if (match[2] === "in") {
      if (!/^\(.*\)$/.test(String(filterValue))) {
        throw new Error("Invalid backend IN filter.");
      }
      filterValue = String(filterValue).slice(1, -1).split(",");
    } else if (filterValue === "null") {
      filterValue = null;
    } else if (filterValue === "true") {
      filterValue = true;
    } else if (filterValue === "false") {
      filterValue = false;
    }
    return {
      column: match[1],
      operator: match[2].toLowerCase(),
      value: filterValue,
    };
  });
}

class StorageBucket {
  constructor(private readonly bucket: string) {}

  async upload(
    path: string,
    file: Blob | ArrayBuffer | Uint8Array | string,
    options?: { contentType?: string; upsert?: boolean; cacheControl?: string },
  ) {
    try {
      const blob =
        file instanceof Blob
          ? file
          : typeof file === "string"
            ? createDataBlob(file, options?.contentType)
            : new Blob([file as BlobPart]);
      const data = await uploadBinary<{ path: string }>(
        `/storage/${encodeURIComponent(this.bucket)}?path=${encodeURIComponent(path)}`,
        blob,
        options?.contentType || blob.type || "application/octet-stream",
        options?.upsert ?? false,
      );
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Upload failed.",
        },
      };
    }
  }

  getPublicUrl(path: string) {
    const query = new URLSearchParams({ path });
    return {
      data: {
        publicUrl: backendUrl(
          `/storage/${encodeURIComponent(this.bucket)}?${query.toString()}`,
        ),
      },
    };
  }

  async remove(paths: string[]) {
    try {
      const result = await apiRequest<{ data: unknown[] }>(
        `/storage/${encodeURIComponent(this.bucket)}`,
        { method: "DELETE", body: { paths } },
      );
      return { data: result.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Delete failed.",
        },
      };
    }
  }
}

function createDataBlob(value: string, contentType?: string): Blob {
  const match = value.match(/^data:([^;,]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("Unsupported encoded upload data.");
  return new Blob([decode(match[2])], {
    type: contentType || match[1],
  });
}

class BackendStorage {
  from(bucket: string): StorageBucket {
    return new StorageBucket(bucket);
  }
}

type RealtimeEvent = {
  eventType: string;
  schema: string;
  table: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

class PollingChannel {
  private listeners: {
    table: string;
    filter?: string;
    event?: string;
    callback: (event: RealtimeEvent) => void;
  }[] = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private snapshots = new Map<string, Map<string, string>>();

  constructor(private readonly name: string) {}

  on(
    _type: string,
    options: {
      event?: string;
      schema?: string;
      table: string;
      filter?: string;
    },
    callback: (event: RealtimeEvent) => void,
  ): this {
    this.listeners.push({
      table: options.table,
      filter: options.filter,
      event: options.event,
      callback,
    });
    return this;
  }

  subscribe(): this {
    if (this.interval) return this;
    this.interval = setInterval(() => void this.poll(), 5000);
    void this.poll();
    return this;
  }

  unsubscribe(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.snapshots.clear();
  }

  private async poll(): Promise<void> {
    for (const [index, listener] of this.listeners.entries()) {
      const query = backendData.from(listener.table).select("*").limit(200);
      if (listener.filter) {
        const match = listener.filter.match(/^([a-z_][a-z0-9_]*)=eq\.(.+)$/i);
        if (!match) {
          if (__DEV__)
            console.warn(`Unsupported realtime filter in ${this.name}.`);
          continue;
        }
        query.eq(match[1], match[2]);
      }
      const result = await query;
      if (result.error || !Array.isArray(result.data)) {
        if (__DEV__ && result.error)
          console.warn("Backend polling failed:", result.error.message);
        continue;
      }

      const key = `${listener.table}:${index}`;
      const previous = this.snapshots.get(key);
      const current = new Map<string, string>();
      for (const row of result.data as Record<string, unknown>[]) {
        if (typeof row.id !== "string") continue;
        const serialized = JSON.stringify(row);
        current.set(row.id, serialized);
        if (previous && !previous.has(row.id)) {
          this.emit(listener, {
            eventType: "INSERT",
            schema: "public",
            table: listener.table,
            new: row,
            old: {},
          });
        } else if (previous && previous.get(row.id) !== serialized) {
          this.emit(listener, {
            eventType: "UPDATE",
            schema: "public",
            table: listener.table,
            new: row,
            old: {},
          });
        }
      }
      if (previous) {
        for (const [id, serialized] of previous) {
          if (!current.has(id)) {
            this.emit(listener, {
              eventType: "DELETE",
              schema: "public",
              table: listener.table,
              new: {},
              old: JSON.parse(serialized) as Record<string, unknown>,
            });
          }
        }
      }
      this.snapshots.set(key, current);
    }
  }

  private emit(
    listener: (typeof this.listeners)[number],
    event: RealtimeEvent,
  ): void {
    if (
      listener.event &&
      listener.event !== "*" &&
      listener.event !== event.eventType
    ) {
      return;
    }
    listener.callback(event);
  }
}

class BackendDataClient {
  readonly storage = new BackendStorage();

  from(table: string): BackendQueryBuilder {
    return new BackendQueryBuilder(table);
  }

  channel(name: string): PollingChannel {
    return new PollingChannel(name);
  }
}

export const backendData = new BackendDataClient();
