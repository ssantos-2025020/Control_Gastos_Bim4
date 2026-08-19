import { Pool, QueryResultRow } from 'pg';

class DatabaseService {
  private static instance: DatabaseService;
  private readonly pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ?? 'postgresql://postgres:admin@localhost:5432/control_gastos',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T[]> {
    const result = await this.pool.query<T>(text, params);
    return result.rows;
  }
}

export const databaseService = DatabaseService.getInstance();
export const query = databaseService.query.bind(databaseService);