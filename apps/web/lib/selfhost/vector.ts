/**
 * Self-hosted Vector search stub.
 * Upstash Vector is used for AI embeddings search - not critical for core functionality.
 * This provides a no-op implementation.
 */

class SelfHostedVectorIndex {
  async upsert(_data: any): Promise<void> {
    // No-op: Vector search is not available in self-hosted mode
  }

  async query(_opts: any): Promise<any[]> {
    return [];
  }

  async delete(_opts: any): Promise<void> {
    // No-op
  }

  async fetch(_ids: string[]): Promise<any[]> {
    return [];
  }

  async reset(): Promise<void> {
    // No-op
  }
}

export const vectorIndex = new SelfHostedVectorIndex();
