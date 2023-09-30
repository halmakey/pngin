export const ByModelIndexName = "byModel";
export const ByModelSequenceIndexName = "byModelSequence";
export const ByCollectionIndexName = "byCollection";
export const ByCollectionSequenceIndexName = "byCollectionSequence";
export const ByAuthorIndexName = "byAuthor";
export const ByAuthorSequenceIndexName = "byAuthorSequence";
export const ByUserIndexName = "byUser";
export const ByDiscordIndexName = "byDiscord";

export default interface Model<
  ModelName extends string,
  PKey extends string,
  ID extends string
> {
  pkey: PKey;
  model: ModelName;
  id: ID;
  sequence?: number;
  timestamp: number;
  ttl?: number;
}
